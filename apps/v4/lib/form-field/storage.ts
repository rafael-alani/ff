import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

export class StudioStorageError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type IO = Pick<
  typeof fs,
  "readFile" | "writeFile" | "lstat" | "mkdir" | "rename" | "rm"
>
type Snapshot = {
  revision: string
  document: unknown
  preset: Buffer
  theme: Buffer
}

/** One storage instance serializes reads and writes for this local dev studio. */
export function createStudioStorage(root: string, io: IO = fs) {
  const stylesRoot = path.join(root, "packages/styles/src")
  let busy = false
  async function assertOwnedPath(file: string) {
    const relative = path.relative(root, file)
    if (relative.startsWith("..") || path.isAbsolute(relative))
      throw new StudioStorageError(400, "Save path is outside this checkout.")
    let cursor = root
    for (const segment of relative.split(path.sep)) {
      cursor = path.join(cursor, segment)
      const stat = await io
        .lstat(cursor)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT") return null
          throw error
        })
      if (stat?.isSymbolicLink())
        throw new StudioStorageError(
          409,
          `Save refuses a symbolic link at ${path.relative(root, cursor)}.`
        )
    }
  }
  async function capture(): Promise<Snapshot> {
    const presetPath = path.join(stylesRoot, "preset.json")
    const themePath = path.join(stylesRoot, "theme.css")
    await assertOwnedPath(presetPath)
    await assertOwnedPath(themePath)
    const [preset, theme] = await Promise.all([
      io.readFile(presetPath),
      io.readFile(themePath),
    ])
    return {
      revision: createHash("sha256").update(preset).update(theme).digest("hex"),
      document: JSON.parse(preset.toString("utf8")),
      preset,
      theme,
    }
  }
  async function exclusive<T>(operation: () => Promise<T>) {
    if (busy)
      throw new StudioStorageError(
        409,
        "Another styles operation is in progress. Try again."
      )
    busy = true
    try {
      return await operation()
    } finally {
      busy = false
    }
  }
  async function atomicWrite(file: string, content: string | Buffer) {
    await assertOwnedPath(file)
    const temporary = path.join(
      path.dirname(file),
      `.${path.basename(file)}.${randomUUID()}.tmp`
    )
    try {
      await io.writeFile(temporary, content, { flag: "wx" })
      await assertOwnedPath(file)
      await io.rename(temporary, file)
    } finally {
      await io.rm(temporary, { force: true })
    }
  }
  const publicSnapshot = (snapshot: Snapshot) => ({
    revision: snapshot.revision,
    document: snapshot.document,
  })
  return {
    read: () => exclusive(async () => publicSnapshot(await capture())),
    save: (document: unknown, theme: string, expectedRevision: unknown) =>
      exclusive(async () => {
        const previous = await capture()
        if (expectedRevision !== previous.revision)
          throw new StudioStorageError(
            409,
            "Styles changed on disk. Reload from styles before saving to protect those edits."
          )
        const backup = path.join(
          root,
          ".studio/backups",
          new Date().toISOString().replaceAll(":", "-") +
            "-" +
            randomUUID().slice(0, 8)
        )
        await assertOwnedPath(backup)
        await io.mkdir(backup, { recursive: true })
        await io.writeFile(path.join(backup, "preset.json"), previous.preset, {
          flag: "wx",
        })
        await io.writeFile(path.join(backup, "theme.css"), previous.theme, {
          flag: "wx",
        })
        // Catch an editor changing either file while the backup was being created.
        if ((await capture()).revision !== previous.revision)
          throw new StudioStorageError(
            409,
            "Styles changed during save. Reload from styles and try again."
          )
        let themeWritten = false
        let presetWritten = false
        try {
          await atomicWrite(path.join(stylesRoot, "theme.css"), theme)
          themeWritten = true
          await atomicWrite(
            path.join(stylesRoot, "preset.json"),
            JSON.stringify(document, null, 2) + "\n"
          )
          presetWritten = true
          return publicSnapshot(await capture())
        } catch (error) {
          try {
            if (themeWritten)
              await atomicWrite(
                path.join(stylesRoot, "theme.css"),
                previous.theme
              )
            if (presetWritten)
              await atomicWrite(
                path.join(stylesRoot, "preset.json"),
                previous.preset
              )
          } catch {
            throw new StudioStorageError(
              500,
              `Save failed and rollback could not complete. Restore the two saved files from ${path.relative(root, backup)}.`
            )
          }
          throw new StudioStorageError(
            500,
            `Save failed; the previous files were restored. ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }),
  }
}
