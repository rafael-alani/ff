import { describe, expect, it } from "vitest"

import { contrastRatio } from "./advanced-metrics"

describe("semantic color contrast", () => {
  it("uses sRGB relative luminance and is symmetric", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBe(21)
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBe(21)
    expect(contrastRatio([123, 45, 67], [123, 45, 67])).toBe(1)
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(
      4.478,
      3
    )
  })
})
