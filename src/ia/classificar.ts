// Sugestão de categoria pela foto, rodando no próprio celular (sem servidor).
// Modelo: MobileCLIP-S0, só a parte que lê imagens, em meia precisão (fp16,
// ~23 MB). A versão comprimida q8 (~12 MB) quase não acerta: no teste com
// fotos reais caiu de 81% para 19% (npm run ia:testar). Os vetores das
// descrições de cada categoria vêm prontos em vetores.json (npm run ia:gerar).
// Baixa uma vez e fica guardado no aparelho; depois funciona sem internet.
import { pontuar, type Palpite, type Vetores } from './pontuar'

interface Modelo {
  ler: (dataUrl: string) => Promise<Float32Array>
  vetores: Vetores
}

let carregando: Promise<Modelo> | null = null

/** Começa a baixar o modelo (se ainda não estiver no aparelho). Pode chamar várias vezes. */
export function prepararIA(): Promise<Modelo> {
  carregando ??= (async () => {
    const [{ AutoProcessor, CLIPVisionModelWithProjection, RawImage, env }, { default: vetores }] = await Promise.all([
      import('@huggingface/transformers'),
      import('./vetores.json'),
    ])
    // Só busca o modelo no Hugging Face; nunca tenta achar em /models do próprio site.
    env.allowLocalModels = false
    const [processor, visao] = await Promise.all([
      AutoProcessor.from_pretrained(vetores.modelo),
      CLIPVisionModelWithProjection.from_pretrained(vetores.modelo, { dtype: 'fp16' }),
    ])
    return {
      vetores: vetores as Vetores,
      async ler(dataUrl) {
        const imagem = await RawImage.fromURL(dataUrl)
        const { image_embeds } = await visao(await processor(imagem))
        return image_embeds.data as Float32Array
      },
    }
  })()
  // Falhou (ex.: sem internet na primeira vez)? Deixa tentar de novo depois.
  carregando.catch(() => {
    carregando = null
  })
  return carregando
}

/** Categorias da mais para a menos provável. */
export async function sugerirCategorias(fotoDataUrl: string): Promise<Palpite[]> {
  const modelo = await prepararIA()
  return pontuar(await modelo.ler(fotoDataUrl), modelo.vetores)
}

/** Quais categorias destacar: a primeira e, se a disputa estiver apertada, a segunda. */
export function destaques(palpites: Palpite[]): string[] {
  const [a, b] = palpites
  if (!a || a.chance < 0.35) return []
  if (b && a.chance < 0.7 && b.chance >= 0.2) return [a.categoria, b.categoria]
  return [a.categoria]
}
