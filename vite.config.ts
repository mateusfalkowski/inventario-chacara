import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: o mesmo build funciona no GitHub Pages (/inventario-chacara/)
// e no Firebase Hosting (/). As rotas são por hash, então não há subpáginas.
export default defineConfig({
  base: './',
  plugins: [react()],
})
