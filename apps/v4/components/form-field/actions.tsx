"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { parseDocument } from "@/lib/form-field/document"
import { SourceExportButtons } from "@/components/form-field/export-buttons"
import { useFormField } from "@/components/form-field/provider"
import { Button } from "@/styles/base-nova/ui/button"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

export function FormFieldActions() {
  const { document: preset, applyDocument } = useFormField()
  const [params] = useDesignSystemSearchParams()
  const { resolvedTheme } = useTheme()
  const [revision, setRevision] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [input, setInput] = React.useState("")
  const isDev = process.env.NODE_ENV === "development"

  React.useEffect(() => {
    if (!isDev) return
    fetch("/api/form-field/styles")
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setRevision(result.revision)
      })
      .catch((error) => setMessage(error.message))
  }, [isDev])

  async function saveOrReload(save: boolean) {
    setBusy(true)
    try {
      const response = await fetch(
        "/api/form-field/styles",
        save
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ document: preset, revision }),
            }
          : undefined
      )
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "Could not access saved styles.")
      setRevision(result.revision)
      if (!save) applyDocument(parseDocument(result.document))
      setMessage(save ? "Saved to styles." : "Saved styles loaded.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Styles operation failed."
      )
    } finally {
      setBusy(false)
    }
  }

  function downloadPreset() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(preset, null, 2) + "\n"], {
        type: "application/json",
      })
    )
    const link = window.document.createElement("a")
    link.href = url
    link.download = "form-field-preset.json"
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <details className="w-full text-xs">
      <summary className="cursor-pointer rounded-md py-2 font-medium focus-visible:outline-2 focus-visible:outline-ring">
        Save &amp; download
      </summary>
      <div className="mt-2 flex max-h-[24dvh] flex-col gap-2 overflow-y-auto overscroll-contain md:max-h-[32dvh]">
        <p className="leading-relaxed text-muted-foreground">
          Source downloads include Essentials, Advanced, and your custom styles.
          Examples use local demo data.
        </p>
        <SourceExportButtons
          document={preset}
          item={params.item}
          mode={resolvedTheme === "dark" ? "dark" : "light"}
        />
        <Button variant="outline" size="sm" onClick={downloadPreset}>
          Download complete preset
        </Button>
        {isDev && (
          <>
            <Button
              size="sm"
              disabled={busy || !revision}
              onClick={() => saveOrReload(true)}
            >
              Save to styles
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => saveOrReload(false)}
            >
              Reload saved styles
            </Button>
          </>
        )}
        <details>
          <summary className="cursor-pointer py-2 focus-visible:outline-2">
            Open complete preset
          </summary>
          <label className="sr-only" htmlFor="ff-preset-input">
            Form &amp; Field preset JSON
          </label>
          <textarea
            id="ff-preset-input"
            className="min-h-24 w-full rounded-md border bg-background p-2 focus-visible:outline-2 focus-visible:outline-ring"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste Form & Field preset JSON"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              try {
                const raw = JSON.parse(input)
                applyDocument(parseDocument(raw))
                setMessage(
                  raw.advanced?.version === 1
                    ? "Preset opened. Colors were retained; retired global Advanced controls were reset. Keep the original preset for reference."
                    : "Preset opened as a browser draft."
                )
                setInput("")
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "Invalid preset JSON."
                )
              }
            }}
          >
            Open preset draft
          </Button>
        </details>
        <p role="status" className="break-words text-muted-foreground">
          {message || "Changes are a browser draft until saved."}
        </p>
      </div>
    </details>
  )
}
