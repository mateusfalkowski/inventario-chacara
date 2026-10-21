// Calcula, uma vez, os vetores das descrições de categoria (src/ia/descricoes.ts)
// e grava em src/ia/vetores.json. Assim o celular só precisa baixar a parte do
// modelo que lê imagens (~12 MB), e não a que lê texto.
// Uso: npm run ia:gerar
import { writeFile } from 'node:fs/promises'
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers'
import { DESCRICOES, frase } from '../src/ia/descricoes.ts'
import { normalizar } from '../src/ia/pontuar.ts'

const MODELO = 'Xenova/mobileclip_s0'

const tokenizer = await AutoTokenizer.from_pretrained(MODELO)
const texto = await CLIPTextModelWithProjection.from_pretrained(MODELO, { dtype: 'fp32' })

const categorias = {}
for (const [id, lista] of Object.entries(DESCRICOES)) {
  const entradas = tokenizer(lista.map(frase), { padding: 'max_length', truncation: true })
  const { text_embeds } = await texto(entradas)
  const [linhas, dim] = text_embeds.dims
  categorias[id] = Array.from({ length: linhas }, (_, i) =>
    normalizar(text_embeds.data.slice(i * dim, (i + 1) * dim)).map((x) => Math.round(x * 1e4) / 1e4),
  )
  console.log(`${id}: ${linhas} descrições`)
}

const destino = new URL('../src/ia/vetores.json', import.meta.url)
await writeFile(destino, JSON.stringify({ modelo: MODELO, categorias }))
console.log('gravado', destino.pathname)
