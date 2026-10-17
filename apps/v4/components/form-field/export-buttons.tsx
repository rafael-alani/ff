"use client"

import * as React from "react"

import type { FormFieldDocument } from "@/lib/form-field/document"
import { Button } from "@/styles/base-nova/ui/button"

export function SourceExportButtons({
  document,
  item,
  mode = "light",
}: {
  document: FormFieldDocument
  item: string
  mode?: "light" | "dark"
}) {
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState("")
  async function download(scope: "selected" | "components") {
    setBusy(scope)
    setError("")
    try {
      const response = await fetch("/api/form-field/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, item, scope, mode }),
      })
      if (!response.ok)
        throw new Error((await response.json()).error || "Export failed")
      const url = URL.createObjectURL(await response.blob())
      const link = window.document.createElement("a")
      link.href = url
      link.download = `form-field-${scope === "components" ? "components" : item}.zip`
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed")
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="h-auto min-h-8 py-2 text-xs whitespace-normal"
        disabled={!!busy}
        onClick={() => download("selected")}
      >
        {busy === "selected" ? "Preparing source…" : "Download this example"}
      </Button>
      <Button
        variant="outline"
        className="h-auto min-h-8 py-2 text-xs whitespace-normal"
        disabled={!!busy}
        onClick={() => download("components")}
      >
        {busy === "components"
          ? "Preparing components…"
          : "All components + this example"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
