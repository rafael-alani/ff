import fs from "node:fs/promises"
import path from "node:path"

import { generateThemeCss, parseDocument } from "@/lib/form-field/document"
import {
  assertLocalStudioRequest,
  readPresetRequest,
} from "@/lib/form-field/local-request"
import {
  createStudioStorage,
  StudioStorageError,
} from "@/lib/form-field/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function repositoryRoot() {
  let directory = process.cwd()
  while (true) {
    try {
      await fs.access(path.join(directory, "pnpm-workspace.yaml"))
      await fs.access(path.join(directory, "packages/styles/src/preset.json"))
      return directory
    } catch {
      const parent = path.dirname(directory)
      if (parent === directory) {
        throw new StudioStorageError(
          500,
          "Cannot locate this checkout's saved styles."
        )
      }
      directory = parent
    }
  }
}

// Shared across hot module reloads so simultaneous requests retain one write lock.
const globals = globalThis as typeof globalThis & {
  __formFieldStorage?: Promise<ReturnType<typeof createStudioStorage>>
}
function storage() {
  return (globals.__formFieldStorage ??= repositoryRoot()
    .then((root) => createStudioStorage(root))
    .catch((error) => {
      globals.__formFieldStorage = undefined
      throw error
    }))
}

function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

function failure(error: unknown) {
  return json(
    {
      error:
        error instanceof Error ? error.message : "Cannot access saved styles.",
    },
    error instanceof StudioStorageError ? error.status : 500
  )
}

export async function GET(request: Request) {
  try {
    assertLocalStudioRequest(request)
    const snapshot = await (await storage()).read()
    return json({
      revision: snapshot.revision,
      document: parseDocument(snapshot.document),
    })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: Request) {
  try {
    assertLocalStudioRequest(request)
    const data = await readPresetRequest(request)
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new StudioStorageError(
        400,
        "Expected a preset document and revision."
      )
    }
    const body = data as Record<string, unknown>
    let document
    try {
      document = parseDocument(body.document)
    } catch (error) {
      throw new StudioStorageError(
        400,
        error instanceof Error ? error.message : "Invalid preset."
      )
    }
    return json(
      await (
        await storage()
      ).save(document, generateThemeCss(document), body.revision)
    )
  } catch (error) {
    return failure(error)
  }
}
