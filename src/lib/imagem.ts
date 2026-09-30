// Comprime a foto no próprio celular antes de salvar. Uma foto de câmera tem
// 3–6 MB; aqui vira ~100–200 KB (foto) + ~10–20 KB (miniatura), o que cabe
// num documento do Firestore (limite 1 MB) e mantém o plano gratuito folgado.

const LIMITE_FOTO = 700_000 // bytes do data URL, bem abaixo de 1 MB

function paraJpeg(img: ImageBitmap, ladoMax: number, qualidade: number) {
  const escala = Math.min(1, ladoMax / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * escala)
  canvas.height = Math.round(img.height * escala)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', qualidade)
}

export async function prepararFoto(arquivo: File) {
  const img = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  try {
    let foto = paraJpeg(img, 1024, 0.72)
    for (const [lado, q] of [[1024, 0.55], [800, 0.5], [640, 0.45]] as const) {
      if (foto.length <= LIMITE_FOTO) break
      foto = paraJpeg(img, lado, q)
    }
    const thumb = paraJpeg(img, 200, 0.6)
    return { foto, thumb }
  } finally {
    img.close()
  }
}
