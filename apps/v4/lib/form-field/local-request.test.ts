import { describe, expect, it } from "vitest"

import {
  assertLocalStudioRequest,
  MAX_PRESET_BYTES,
  readPresetRequest,
} from "./local-request"

function request(
  options: {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
) {
  const url = options.url ?? "http://127.0.0.1:4000/api/form-field/styles"
  return new Request(url, {
    method: options.method ?? "POST",
    headers: {
      host: new URL(url).host,
      origin: new URL(url).origin,
      "content-type": "application/json",
      ...options.headers,
    },
    body: options.body,
  })
}

describe("local styles request boundary", () => {
  it("allows a same-origin loopback request only in development", () => {
    expect(() =>
      assertLocalStudioRequest(request(), "development")
    ).not.toThrow()
    expect(() => assertLocalStudioRequest(request(), "production")).toThrow(
      "only in local development"
    )
  })

  it("accepts Next's normalized loopback URL while checking the actual browser origin", () => {
    const normalized = request({
      url: "http://localhost:4000/api/form-field/styles",
      headers: {
        host: "127.0.0.1:4000",
        origin: "http://127.0.0.1:4000",
        "x-forwarded-host": "127.0.0.1:4000",
      },
    })
    expect(() =>
      assertLocalStudioRequest(normalized, "development")
    ).not.toThrow()
    normalized.headers.set("origin", "http://localhost:4000")
    expect(() => assertLocalStudioRequest(normalized, "development")).toThrow(
      "same local studio origin"
    )
  })

  it("rejects cross-origin, non-loopback, forwarded, and mismatched host requests", () => {
    const invalid = [
      request({ headers: { origin: "https://example.com" } }),
      request({ url: "http://192.168.1.5:4000/api/form-field/styles" }),
      request({ headers: { host: "evil.test" } }),
      request({ headers: { "x-forwarded-host": "evil.test" } }),
      request({ headers: { "x-forwarded-for": "192.168.1.5" } }),
      request({ headers: { "sec-fetch-site": "cross-site" } }),
    ]
    invalid.forEach((value) =>
      expect(() => assertLocalStudioRequest(value, "development")).toThrow(
        "same local studio origin"
      )
    )
  })

  it("allows origin-less GETs and requires an Origin for POSTs", () => {
    const get = request({ method: "GET" })
    get.headers.delete("origin")
    expect(() => assertLocalStudioRequest(get, "development")).not.toThrow()
    const post = request()
    post.headers.delete("origin")
    expect(() => assertLocalStudioRequest(post, "development")).toThrow()
  })

  it("decodes JSON and rejects invalid content types and JSON", async () => {
    await expect(
      readPresetRequest(request({ body: '{"version":1}' }))
    ).resolves.toEqual({ version: 1 })
    await expect(
      readPresetRequest(
        request({ body: "{}", headers: { "content-type": "text/plain" } })
      )
    ).rejects.toMatchObject({ status: 415 })
    await expect(
      readPresetRequest(request({ body: "{" }))
    ).rejects.toMatchObject({ status: 400 })
  })

  it("bounds UTF-8 bytes even when Content-Length is absent or understated", async () => {
    await expect(
      readPresetRequest(
        request({
          body: '"' + "é".repeat(MAX_PRESET_BYTES / 2) + '"',
          headers: { "content-length": "1" },
        })
      )
    ).rejects.toMatchObject({ status: 413 })
    await expect(
      readPresetRequest(
        request({
          body: "{}",
          headers: { "content-length": String(MAX_PRESET_BYTES + 1) },
        })
      )
    ).rejects.toMatchObject({ status: 413 })
  })
})
