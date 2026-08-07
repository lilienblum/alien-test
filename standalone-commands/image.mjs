function positiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`)
  }
  return value
}

export function resizeRgba(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("resize-image input must be an object")
  }

  const sourceWidth = positiveInteger(input.sourceWidth, "sourceWidth")
  const sourceHeight = positiveInteger(input.sourceHeight, "sourceHeight")
  const targetWidth = positiveInteger(input.targetWidth, "targetWidth")
  const targetHeight = positiveInteger(input.targetHeight, "targetHeight")
  if (typeof input.rgbaBase64 !== "string" || input.rgbaBase64.length === 0) {
    throw new TypeError("rgbaBase64 must be a non-empty string")
  }

  const source = Buffer.from(input.rgbaBase64, "base64")
  const expectedLength = sourceWidth * sourceHeight * 4
  if (source.length !== expectedLength) {
    throw new TypeError(`RGBA input has ${source.length} bytes; expected ${expectedLength}`)
  }

  const resized = Buffer.alloc(targetWidth * targetHeight * 4)
  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = Math.floor((targetY * sourceHeight) / targetHeight)
    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = Math.floor((targetX * sourceWidth) / targetWidth)
      const sourceOffset = (sourceY * sourceWidth + sourceX) * 4
      const targetOffset = (targetY * targetWidth + targetX) * 4
      source.copy(resized, targetOffset, sourceOffset, sourceOffset + 4)
    }
  }

  return {
    format: "rgba",
    width: targetWidth,
    height: targetHeight,
    rgbaBase64: resized.toString("base64"),
  }
}
