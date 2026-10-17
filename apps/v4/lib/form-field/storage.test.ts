import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { createStudioStorage } from "./storage"

const roots: string[] = []
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))
  )
})

async function fixture(io: Parameters<typeof createStudioStorage>[1] = fs) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ff-studio-save-"))
  roots.push(root)
  const directory = path.join(root, "packages/styles/src")
  await fs.mkdir(directory, { recursive: true })
  const before = {
    preset: '{"version":1,"essentials":{"style":"nova"},"advanced":{}}\n',
    theme: "/* original */\n",
    overrides: "button { letter-spacing: .1em; }\n",
  }
  await fs.writeFile(path.join(directory, "preset.json"), before.preset)
  await fs.writeFile(path.join(directory, "theme.css"), before.theme)
  await fs.writeFile(path.join(directory, "overrides.css"), before.overrides)
  return {
    root,
    directory,
    before,
    storage: createStudioStorage(root, io),
    read: (file: string) => fs.readFile(path.join(directory, file), "utf8"),
  }
}

describe("local styles storage", () => {
  it("captures the document and revision from the same file bytes", async () => {
    const f = await fixture()
    const result = await f.storage.read()
    expect(result.document).toEqual(JSON.parse(f.before.preset))
    expect(result.revision).toBe(
      createHash("sha256")
        .update(f.before.preset)
        .update(f.before.theme)
        .digest("hex")
    )
  })

  it("backs up both files and preserves manually maintained overrides", async () => {
    const f = await fixture()
    const initial = await f.storage.read()
    const document = { version: 1, essentials: { style: "lyra" }, advanced: {} }
    const result = await f.storage.save(
      document,
      "/* changed */\n",
      initial.revision
    )
    expect(result.document).toEqual(document)
    expect(result.revision).not.toBe(initial.revision)
    expect(await f.read("preset.json")).toBe(
      JSON.stringify(document, null, 2) + "\n"
    )
    expect(await f.read("theme.css")).toBe("/* changed */\n")
    expect(await f.read("overrides.css")).toBe(f.before.overrides)
    const backups = await fs.readdir(path.join(f.root, ".studio/backups"))
    expect(backups).toHaveLength(1)
    expect(
      await fs.readFile(
        path.join(f.root, ".studio/backups", backups[0], "preset.json"),
        "utf8"
      )
    ).toBe(f.before.preset)
    expect(
      await fs.readFile(
        path.join(f.root, ".studio/backups", backups[0], "theme.css"),
        "utf8"
      )
    ).toBe(f.before.theme)
  })

  it("refuses a stale revision before replacing editor changes", async () => {
    const f = await fixture()
    const initial = await f.storage.read()
    await fs.writeFile(
      path.join(f.directory, "theme.css"),
      "/* editor change */\n"
    )
    await expect(
      f.storage.save({}, "new", initial.revision)
    ).rejects.toMatchObject({ status: 409 })
    expect(await f.read("theme.css")).toBe("/* editor change */\n")
    expect(await f.read("preset.json")).toBe(f.before.preset)
  })

  it("refuses concurrent saves and reads while a write is pending", async () => {
    const f = await fixture()
    const initial = await f.storage.read()
    const first = f.storage.save({ style: "lyra" }, "first", initial.revision)
    await expect(
      f.storage.save({}, "second", initial.revision)
    ).rejects.toMatchObject({ status: 409 })
    await expect(f.storage.read()).rejects.toMatchObject({ status: 409 })
    await first
    expect(await f.read("theme.css")).toBe("first")
  })

  it("restores the original pair when the second replacement fails", async () => {
    let failed = false
    const f = await fixture({
      ...fs,
      rename: async (from, to) => {
        if (!failed && path.basename(String(to)) === "preset.json") {
          failed = true
          throw new Error("simulated replacement failure")
        }
        return fs.rename(from, to)
      },
    })
    const initial = await f.storage.read()
    await expect(f.storage.save({}, "new", initial.revision)).rejects.toThrow(
      "previous files were restored"
    )
    expect(await f.read("theme.css")).toBe(f.before.theme)
    expect(await f.read("preset.json")).toBe(f.before.preset)
    expect(await f.read("overrides.css")).toBe(f.before.overrides)
    expect(
      (await fs.readdir(f.directory)).filter((file) => file.endsWith(".tmp"))
    ).toEqual([])
  })

  it("refuses symlinks in the theme and backup paths", async () => {
    const f = await fixture()
    const outside = path.join(f.root, "external.css")
    await fs.writeFile(outside, "outside")
    await fs.rm(path.join(f.directory, "theme.css"))
    await fs.symlink(outside, path.join(f.directory, "theme.css"))
    await expect(f.storage.read()).rejects.toThrow("symbolic link")
    await fs.rm(path.join(f.directory, "theme.css"))
    await fs.writeFile(path.join(f.directory, "theme.css"), f.before.theme)
    const initial = await f.storage.read()
    const externalDirectory = path.join(f.root, "external-directory")
    await fs.mkdir(externalDirectory)
    await fs.symlink(externalDirectory, path.join(f.root, ".studio"))
    await expect(f.storage.save({}, "new", initial.revision)).rejects.toThrow(
      "symbolic link"
    )
    expect(await fs.readdir(externalDirectory)).toEqual([])
    expect(await fs.readFile(outside, "utf8")).toBe("outside")
    expect(await f.read("theme.css")).toBe(f.before.theme)
  })

  it("detects an external edit made while preparing the backup", async () => {
    let stylesDirectory = ""
    let changed = false
    const f = await fixture({
      ...fs,
      writeFile: (async (...args: Parameters<typeof fs.writeFile>) => {
        const result = await fs.writeFile(...args)
        if (
          !changed &&
          String(args[0]).includes(`${path.sep}.studio${path.sep}`)
        ) {
          changed = true
          await fs.writeFile(
            path.join(stylesDirectory, "theme.css"),
            "/* concurrent editor */\n"
          )
        }
        return result
      }) as typeof fs.writeFile,
    })
    stylesDirectory = f.directory
    const initial = await f.storage.read()
    await expect(f.storage.save({}, "new", initial.revision)).rejects.toThrow(
      "Styles changed during save"
    )
    expect(await f.read("theme.css")).toBe("/* concurrent editor */\n")
    expect(await f.read("preset.json")).toBe(f.before.preset)
  })
})
