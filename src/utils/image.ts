/** Reads an image file and downsizes it to a JPEG/PNG data URL suitable for local persistence. */
export function readImage(file: File, maxWidth: number, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file (PNG, JPG or WebP).'))
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Images must be smaller than 8 MB.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Couldn’t read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That image appears to be corrupted.'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL(type, 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
