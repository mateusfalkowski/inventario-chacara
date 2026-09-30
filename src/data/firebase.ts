// Firebase no plano gratuito (Spark): Firestore + login anônimo.
// Sem Cloud Storage (exige plano pago), então a foto comprimida vai num
// documento próprio em `fotos/{id}` e a miniatura dentro do item.
// Se o projeto crescer (plano Blaze), dá para migrar as fotos para o Storage
// trocando só a função `foto` e a gravação em `adicionar`.
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import type { Item } from '../types'
import type { Store } from './store'

const env = import.meta.env

export async function criarStoreFirebase(): Promise<Store> {
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })

  // Cache persistente = o app mostra e grava dados mesmo sem internet.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })

  // As regras do banco exigem login; o login anônimo fica salvo no aparelho,
  // então depois da primeira vez funciona offline também.
  const auth = getAuth(app)
  const logado = new Promise<void>((ok) => {
    const parar = onAuthStateChanged(auth, (user) => {
      if (user) {
        parar()
        ok()
      }
    })
  })
  if (!auth.currentUser) {
    await auth.authStateReady()
    if (!auth.currentUser) signInAnonymously(auth).catch((e) => console.error('Login anônimo falhou', e))
  }

  const falhou = (e: unknown) => console.error('Erro ao gravar no Firestore', e)

  return {
    modo: 'firebase',
    observar(cb) {
      let cancelar = () => {}
      let ativo = true
      void logado.then(() => {
        if (!ativo) return
        cancelar = onSnapshot(collection(db, 'itens'), (snap) => cb(snap.docs.map((d) => d.data() as Item)))
      })
      return () => {
        ativo = false
        cancelar()
      }
    },
    adicionar(item, foto) {
      // Sem await: offline, a promessa só resolve quando o servidor confirmar,
      // mas o item já aparece na tela na hora pelo cache local.
      void logado.then(() => {
        setDoc(doc(db, 'itens', item.id), item).catch(falhou)
        if (foto) setDoc(doc(db, 'fotos', item.id), { data: foto }).catch(falhou)
      })
    },
    atualizar(id, dados) {
      void logado.then(() => updateDoc(doc(db, 'itens', id), dados).catch(falhou))
    },
    darSaida(id, mov) {
      void logado.then(() =>
        updateDoc(doc(db, 'itens', id), {
          quantidade: increment(-mov.quantidade),
          movimentos: arrayUnion(mov),
          atualizadoEm: mov.em,
        }).catch(falhou),
      )
    },
    async foto(id) {
      await logado
      const snap = await getDoc(doc(db, 'fotos', id))
      return snap.exists() ? (snap.data().data as string) : null
    },
  }
}
