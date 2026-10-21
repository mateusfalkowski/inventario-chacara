// Mede quanto a IA acerta a categoria. Recebe uma pasta com uma subpasta por
// categoria (nomes iguais aos ids de src/config.ts), cada uma com fotos .jpg/.png.
// Usa o mesmo modelo quantizado que o celular baixa. As fotos não vão para o git.
// Uso: npm run ia:testar -- caminho/da/pasta
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers'
import { pontuar } from '../src/ia/pontuar.ts'
import vetores from '../src/ia/vetores.json' with { type: 'json' }

const pasta = process.argv[2]
if (!pasta) throw new Error('Informe a pasta com as fotos de teste')

const processor = await AutoProcessor.from_pretrained(vetores.modelo)
// IA_DTYPE permite comparar versões do modelo (q8, fp16, fp32...).
const dtype = process.env.IA_DTYPE ?? 'q8'
const visao = await CLIPVisionModelWithProjection.from_pretrained(vetores.modelo, { dtype })
console.log('modelo de imagem:', dtype)

let total = 0, acertos = 0, nosTres = 0
for (const cat of (await readdir(pasta, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  for (const arquivo of (await readdir(join(pasta, cat))).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
    const imagem = await RawImage.read(join(pasta, cat, arquivo))
    const { image_embeds } = await visao(await processor(imagem))
    const palpites = pontuar(image_embeds.data, vetores)
    const certo = palpites[0].categoria === cat
    total++
    if (certo) acertos++
    if (palpites.slice(0, 3).some((p) => p.categoria === cat)) nosTres++
    const top = palpites.slice(0, 3).map((p) => `${p.categoria} ${(p.chance * 100).toFixed(0)}%`).join(', ')
    console.log(`${certo ? 'OK  ' : 'ERRO'} ${cat}/${arquivo}  →  ${top}`)
  }
}
console.log(`\nAcertou de primeira: ${acertos}/${total} (${((acertos / total) * 100).toFixed(0)}%)`)
console.log(`Certa entre as 3 primeiras: ${nosTres}/${total} (${((nosTres / total) * 100).toFixed(0)}%)`)
