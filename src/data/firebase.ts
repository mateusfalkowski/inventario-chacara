// Firebase no plano gratuito (Spark): Firestore + login anônimo automático
// (sem senha: o app entra sozinho ao abrir).
// Sem Cloud Storage (exige plano pago), então a foto comprimida vai num
// documento próprio em `fotos/{id}` e a miniatura dentro do item.
// Se o projeto crescer (plano Blaze), dá para migrar as fotos para o Storage
// trocando só a função `foto` e a gravação em `adicionar`.
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  arrayRemove,
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
import { variacao, type Store } from './store'

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

  // Sem senha: o app entra sozinho com um login anônimo. As regras do banco só
  // exigem estar logado (quem não abre o app não lê nem grava). O login fica salvo
  // no aparelho, então depois da primeira vez com internet funciona offline também.
  const auth = getAuth(app)
  const entrarSozinho = () => {
    if (!auth.currentUser) signInAnonymously(auth).catch((e) => console.error('Login automático falhou', e))
  }
  onAuthStateChanged(auth, (user) => {
    if (!user) entrarSozinho()
  })
  // Primeira vez sem internet: tenta de novo quando o sinal voltar.
  window.addEventListener('online', entrarSozinho)
  const logado = new Promise<void>((ok) => {
    const parar = onAuthStateChanged(auth, (user) => {
      if (user) {
        parar()
        ok()
      }
    })
  })

  const falhou = (e: unknown) => console.error('Erro ao gravar no Firestore', e)

  return {
    modo: 'firebase',
    observar(cb) {
      // A lista acompanha o login: liga ao entrar, desliga (e esvazia) ao sair e
      // religa no próximo login. Sem isso, se o login cair e voltar, a lista
      // ficaria congelada.
      let cancelarLista = () => {}
      const pararLogin = onAuthStateChanged(auth, (user) => {
        cancelarLista()
        cancelarLista = () => {}
        if (!user) {
          cb([])
          return
        }
        cancelarLista = onSnapshot(
          collection(db, 'itens'),
          (snap) => cb(snap.docs.map((d) => d.data() as Item)),
          (e) => console.error('Erro ao ler o estoque', e),
        )
      })
      return () => {
        pararLogin()
        cancelarLista()
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
    movimentar(id, mov) {
      void logado.then(() =>
        updateDoc(doc(db, 'itens', id), {
          quantidade: increment(variacao(mov)),
          movimentos: arrayUnion(mov),
          atualizadoEm: mov.em,
        }).catch(falhou),
      )
    },
    desfazerSaida(id, mov) {
      // arrayRemove apaga o movimento que for idêntico a `mov`.
      void logado.then(() =>
        updateDoc(doc(db, 'itens', id), {
          quantidade: increment(mov.quantidade),
          movimentos: arrayRemove(mov),
          atualizadoEm: Date.now(),
        }).catch(falhou),
      )
    },
    async foto(id) {
      await logado
      const snap = await getDoc(doc(db, 'fotos', id))
      return snap.exists() ? (snap.data().data as string) : null
    },
    observarLogin(cb) {
      return onAuthStateChanged(auth, (user) => cb(Boolean(user)))
    },
  }
}
