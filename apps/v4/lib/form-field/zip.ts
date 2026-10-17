/** Small, dependency-free ZIP writer. Entries use the standard STORE method. */
export function createZip(files: Map<string, string | Uint8Array>): Uint8Array {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const [path, value] of files) {
    if (!path || path.startsWith("/") || path.split("/").includes("..")) {
      throw new Error("Invalid archive path")
    }
    const name = encoder.encode(path)
    const data = typeof value === "string" ? encoder.encode(value) : value
    let crc = 0xffffffff
    for (const byte of data) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
    crc = (crc ^ 0xffffffff) >>> 0
    const local = new Uint8Array(30 + name.length + data.length)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 0x800, true)
    view.setUint16(12, 33, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, data.length, true)
    view.setUint32(22, data.length, true)
    view.setUint16(26, name.length, true)
    local.set(name, 30)
    local.set(data, 30 + name.length)
    locals.push(local)
    const entry = new Uint8Array(46 + name.length)
    const table = new DataView(entry.buffer)
    table.setUint32(0, 0x02014b50, true)
    table.setUint16(4, 20, true)
    table.setUint16(6, 20, true)
    table.setUint16(8, 0x800, true)
    table.setUint16(14, 33, true)
    table.setUint32(16, crc, true)
    table.setUint32(20, data.length, true)
    table.setUint32(24, data.length, true)
    table.setUint16(28, name.length, true)
    table.setUint32(42, offset, true)
    entry.set(name, 46)
    central.push(entry)
    offset += local.length
  }
  const directoryLength = central.reduce((sum, entry) => sum + entry.length, 0)
  const end = new Uint8Array(22)
  const view = new DataView(end.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, files.size, true)
  view.setUint16(10, files.size, true)
  view.setUint32(12, directoryLength, true)
  view.setUint32(16, offset, true)
  const result = new Uint8Array(offset + directoryLength + end.length)
  let cursor = 0
  for (const part of [...locals, ...central, end]) {
    result.set(part, cursor)
    cursor += part.length
  }
  return result
}
