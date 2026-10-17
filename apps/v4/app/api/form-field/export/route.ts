import type { NextRequest } from "next/server"

import {
  buildSourceZip,
  type SourceExportRequest,
} from "@/lib/form-field/export"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as SourceExportRequest
    const zip = await buildSourceZip(input)
    return new Response(zip.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="form-field-${input.scope === "components" ? "components" : "selected"}.zip"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The source export could not be created",
      },
      { status: 400 }
    )
  }
}
