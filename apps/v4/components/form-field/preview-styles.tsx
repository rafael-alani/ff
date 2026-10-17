"use client"

import * as React from "react"

import { buildAdvancedCss, parseAdvanced } from "@/lib/form-field/advanced"
import { measureAdvancedDefaults } from "@/lib/form-field/advanced-metrics"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

import savedPreset from "../../../../packages/styles/src/preset.json"

import "../../../../packages/styles/src/overrides.css"

export function AdvancedPreviewStyles() {
  const [params] = useDesignSystemSearchParams()
  const probeRef = React.useRef<HTMLDivElement>(null)
  const [settings, setSettings] = React.useState(() =>
    parseAdvanced(savedPreset.advanced)
  )
  React.useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "form-field-advanced"
      )
        return
      setSettings(parseAdvanced(event.data.settings))
    }
    window.addEventListener("message", receive)
    if (window.parent !== window)
      window.parent.postMessage(
        { type: "form-field-ready" },
        window.location.origin
      )
    return () => window.removeEventListener("message", receive)
  }, [])
  React.useEffect(() => {
    const element = document.createElement("style")
    element.dataset.formField = "advanced"
    element.textContent = buildAdvancedCss(settings)
    document.head.appendChild(element)
    return () => element.remove()
  }, [settings])
  React.useEffect(() => {
    let cancelled = false
    const measure = () => {
      if (cancelled || !probeRef.current) return
      const sheet = document.querySelector<HTMLStyleElement>(
        'style[data-form-field="advanced"]'
      )?.sheet
      // Reading and restoring in one task prevents a visible unstyled frame.
      if (sheet) sheet.disabled = true
      let metrics
      try {
        metrics = measureAdvancedDefaults(probeRef.current)
      } finally {
        if (sheet) sheet.disabled = false
      }
      window.parent.postMessage(
        { type: "form-field-defaults", metrics },
        window.location.origin
      )
    }
    const frame = requestAnimationFrame(measure)
    void document.fonts.ready.then(measure)
    window.addEventListener("resize", measure)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", measure)
    }
  }, [params, settings])
  return (
    <div
      ref={probeRef}
      inert
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -10000,
        top: 0,
        width: 400,
        visibility: "hidden",
        pointerEvents: "none",
      }}
    >
      <p data-probe="body">Body copy</p>
      <button
        data-probe="label"
        data-slot="button"
        data-size="default"
        className="cn-button cn-button-size-default cn-button-variant-default"
      >
        Label
      </button>
      <input data-probe="input" className="cn-input" tabIndex={-1} />
      <div
        data-probe="card"
        data-slot="card"
        data-size="default"
        className="cn-card group/card flex flex-col"
      >
        <div data-probe="heading" className="cn-card-title">
          Title
        </div>
        <div data-probe="content" className="cn-card-content">
          Content
        </div>
      </div>
      <div data-probe="overlay" className="cn-popover-content">
        Overlay
      </div>
    </div>
  )
}
