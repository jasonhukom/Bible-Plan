export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // set canvas size to match the bounding box
  canvas.width = image.width
  canvas.height = image.height

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(image.width / 2, image.height / 2)
  ctx.rotate(getRadianAngle(rotation))
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0)

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg')
  })
}
