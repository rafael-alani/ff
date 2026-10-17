"use client"

import * as React from "react"

import { parseAdvanced, type AdvancedSettings } from "@/lib/form-field/advanced"
import { type AdvancedMetrics } from "@/lib/form-field/advanced-metrics"
import {
  parseDocument,
  type FormFieldDocument,
} from "@/lib/form-field/document"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

import savedPreset from "../../../../packages/styles/src/preset.json"

const DRAFT_KEY = "form-field-fork-draft-v1"
const initial = parseDocument(savedPreset)
const Context = React.createContext<{
  migrationNotice: string
  inherited: AdvancedMetrics
  setInherited: (value: AdvancedMetrics) => void
  document: FormFieldDocument
  advanced: AdvancedSettings
  setAdvanced: (value: AdvancedSettings) => void
  applyDocument: (value: FormFieldDocument) => void
} | null>(null)

export function FormFieldProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useDesignSystemSearchParams()
  const [migrationNotice, setMigrationNotice] = React.useState("")
  const [inherited, setInherited] = React.useState<AdvancedMetrics>({})
  const [advanced, setAdvanced] = React.useState(initial.advanced)
  const [ready, setReady] = React.useState(false)
  const hadExplicitQuery = React.useRef(
    typeof window !== "undefined" && Boolean(window.location.search)
  )

  React.useEffect(() => {
    let restored = initial
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const raw = JSON.parse(draft)
        restored = parseDocument(raw)
        if (raw.advanced?.version === 1) {
          localStorage.setItem(
            "form-field-fork-draft-v1-before-advanced-v2",
            draft
          )
          setMigrationNotice(
            "Advanced has been redesigned. Your colors were retained; retired global controls were reset. The previous draft is backed up in this browser."
          )
        }
      }
    } catch {
      /* A malformed browser draft never replaces saved defaults. */
    }
    setAdvanced(restored.advanced)
    if (!hadExplicitQuery.current) void setParams(restored.essentials)
    setReady(true)
    // Restore once; later URL updates remain owned by upstream's controls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const document = React.useMemo(
    () =>
      parseDocument({
        version: 1,
        essentials: { ...initial.essentials, ...params },
        advanced,
      }),
    [params, advanced]
  )

  React.useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(document))
    } catch {
      /* Storage may be unavailable. */
    }
  }, [document, ready])

  const applyDocument = React.useCallback(
    (value: FormFieldDocument) => {
      const validated = parseDocument(value)
      setAdvanced(validated.advanced)
      void setParams(validated.essentials)
    },
    [setParams]
  )

  return (
    <Context.Provider
      value={{
        migrationNotice,
        inherited,
        setInherited,
        document,
        advanced,
        setAdvanced: (value) => setAdvanced(parseAdvanced(value)),
        applyDocument,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useFormField() {
  const context = React.useContext(Context)
  if (!context) throw new Error("Form & Field controls require their provider.")
  return context
}

/** An explicit ready handshake also covers a preview hydrated after its load event. */
export function useAdvancedFrame(
  ref: React.RefObject<HTMLIFrameElement | null>,
  frameKey: string
) {
  const { advanced, setInherited } = useFormField()
  React.useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    const send = () =>
      iframe.contentWindow?.postMessage(
        { type: "form-field-advanced", settings: advanced },
        window.location.origin
      )
    const ready = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === iframe.contentWindow
      ) {
        if (event.data?.type === "form-field-ready") send()
        if (event.data?.type === "form-field-defaults")
          setInherited(event.data.metrics)
      }
    }
    send()
    iframe.addEventListener("load", send)
    window.addEventListener("message", ready)
    return () => {
      iframe.removeEventListener("load", send)
      window.removeEventListener("message", ready)
    }
  }, [advanced, ref, frameKey, setInherited])
}
