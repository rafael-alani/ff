import { StudioStorageError } from "./storage"

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"])
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"])
export const MAX_PRESET_BYTES = 64_000

/** Next's Request has no socket. The development command also binds to loopback. */
export function assertLocalStudioRequest(
  request: Request,
  environment = process.env.NODE_ENV
) {
  if (environment !== "development") {
    throw new StudioStorageError(
      404,
      "Save to styles is available only in local development."
    )
  }
  const url = new URL(request.url)
  const host = request.headers.get("host")
  // Next normalizes Request.url to its configured hostname. Validate the
  // actual Host separately so localhost and 127.0.0.1 both work, while the
  // POST Origin must still match the exact address used by the browser.
  let actualOrigin: URL
  try {
    actualOrigin = new URL(`${url.protocol}//${host}`)
  } catch {
    throw new StudioStorageError(
      403,
      "Save requires the same local studio origin."
    )
  }
  const origin = request.headers.get("origin")
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (
    !LOOPBACK_HOSTS.has(url.hostname) ||
    !LOOPBACK_HOSTS.has(actualOrigin.hostname) ||
    host !== actualOrigin.host ||
    (forwardedHost && forwardedHost !== host) ||
    (forwardedFor &&
      forwardedFor
        .split(",")
        .some((address) => !LOOPBACK_ADDRESSES.has(address.trim()))) ||
    (origin !== null && origin !== actualOrigin.origin) ||
    (request.method === "POST" && origin !== actualOrigin.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new StudioStorageError(
      403,
      "Save requires the same local studio origin."
    )
  }
}

export async function readPresetRequest(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new StudioStorageError(415, "Send the preset as application/json.")
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_PRESET_BYTES) {
    throw new StudioStorageError(413, "Preset too large.")
  }
  if (!request.body)
    throw new StudioStorageError(400, "The preset body is empty.")
  const reader = request.body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let bytes = 0
  let body = ""
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > MAX_PRESET_BYTES) {
        await reader.cancel()
        throw new StudioStorageError(413, "Preset too large.")
      }
      body += decoder.decode(chunk.value, { stream: true })
    }
    body += decoder.decode()
    return JSON.parse(body)
  } catch (error) {
    if (error instanceof StudioStorageError) throw error
    throw new StudioStorageError(
      400,
      "The preset body must be valid UTF-8 JSON."
    )
  } finally {
    reader.releaseLock()
  }
}
