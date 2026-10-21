// Descrições usadas pela IA para reconhecer cada categoria na foto.
// Em inglês porque o modelo (MobileCLIP) foi treinado assim. Várias por
// categoria: a foto conta como da categoria cuja descrição combinar melhor.
// As chaves são os ids de CATEGORIAS em src/config.ts.
// Mudou algo aqui? Rode `npm run ia:gerar` para recalcular src/ia/vetores.json.

export const DESCRICOES: Record<string, string[]> = {
  madeira: [
    'a pile of wooden planks',
    'lumber boards',
    'wooden beams',
    'pieces of scrap wood',
    'plywood sheets',
    'a wooden pallet',
  ],
  ceramica: [
    'ceramic floor tiles',
    'a stack of ceramic tiles',
    'wall tiles',
    'porcelain tiles',
    'bricks',
    'clay roof tiles',
  ],
  loucas: [
    'a toilet',
    'a bathroom sink',
    'a washbasin',
    'a bathtub',
    'a faucet',
    'a shower head',
  ],
  metais: [
    'metal hardware',
    'a pile of scrap metal',
    'steel bars',
    'rebar',
    'door hinges and handles',
    'screws and bolts',
    'metal sheets',
  ],
  tubos: [
    'PVC pipes',
    'plumbing pipes',
    'electrical wires',
    'a roll of electric cable',
    'an electrical breaker panel',
    'electrical outlets and switches',
  ],
  esquadrias: [
    'a wooden door',
    'a door',
    'a window',
    'a window frame',
    'a glass door',
    'a metal gate',
    'an aluminum window',
  ],
  moveis: [
    'a chair',
    'a table',
    'a sofa',
    'a cabinet',
    'a wardrobe',
    'a desk',
    'a bookshelf',
  ],
  iluminacao: [
    'a lamp',
    'a ceiling light',
    'a light fixture',
    'a light bulb',
    'a chandelier',
    'a fluorescent tube light',
    'a floor lamp',
  ],
  outros: [
    'a cardboard box',
    'a bag of cement',
    'a can of paint',
    'hand tools',
    'a bucket',
  ],
}

/** O modelo responde melhor a frases do tipo "a photo of ...". */
export const frase = (d: string) => `a photo of ${d}`
