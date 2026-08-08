interface ResizeInput {
  sourceWidth: number
  sourceHeight: number
  targetWidth: number
  targetHeight: number
  rgbaBase64: string
}

function positiveInteger(value: unknown, name: string): number {
  if (!Number.isInteger(value) || typeof value !== "number" || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`)
  }
  return value
}

function resizeInput(value: unknown): ResizeInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("resize-image input must be an object")
  }

  const input = value as Record<string, unknown>
  const rgbaBase64 = input.rgbaBase64
  if (typeof rgbaBase64 !== "string" || rgbaBase64.length === 0) {
    throw new TypeError("rgbaBase64 must be a non-empty string")
  }

  return {
    sourceWidth: positiveInteger(input.sourceWidth, "sourceWidth"),
    sourceHeight: positiveInteger(input.sourceHeight, "sourceHeight"),
    targetWidth: positiveInteger(input.targetWidth, "targetWidth"),
    targetHeight: positiveInteger(input.targetHeight, "targetHeight"),
    rgbaBase64,
  }
}

export function resizeRgba(value: unknown) {
  const input = resizeInput(value)
  const source = Buffer.from(input.rgbaBase64, "base64")
  const expectedLength = input.sourceWidth * input.sourceHeight * 4
  if (source.length !== expectedLength) {
    throw new TypeError(`RGBA input has ${source.length} bytes; expected ${expectedLength}`)
  }

  const resized = Buffer.alloc(input.targetWidth * input.targetHeight * 4)
  for (let targetY = 0; targetY < input.targetHeight; targetY += 1) {
    const sourceY = Math.floor((targetY * input.sourceHeight) / input.targetHeight)
    for (let targetX = 0; targetX < input.targetWidth; targetX += 1) {
      const sourceX = Math.floor((targetX * input.sourceWidth) / input.targetWidth)
      const sourceOffset = (sourceY * input.sourceWidth + sourceX) * 4
      const targetOffset = (targetY * input.targetWidth + targetX) * 4
      source.copy(resized, targetOffset, sourceOffset, sourceOffset + 4)
    }
  }

  return {
    format: "rgba",
    width: input.targetWidth,
    height: input.targetHeight,
    rgbaBase64: resized.toString("base64"),
  }
}
