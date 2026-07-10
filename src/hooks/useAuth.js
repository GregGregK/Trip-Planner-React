// src/hooks/useAuth.js
import { useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import useTripStore from '../store/useTripStore'

export function useAuth() {
  const {
    setCurrentUser,
    loadUserTrip,
    createUserDoc,
    reset,
    currentTripId,
    data,
    links,
    hotels,
    tours,
  } = useTripStore()

  // ─── Listener de autenticação ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        await loadUserTrip(user)
      } else {
        reset()
      }
    })
    return unsubscribe
  }, [])

  // ─── Login ────────────────────────────────────────────────────────────────
  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  // ─── Registro ─────────────────────────────────────────────────────────────
  async function register(name, email, password) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    await createUserDoc(credential.user.uid, name, email)

    try {
      await sendEmailVerification(credential.user)
    } catch {
      console.warn('Não foi possível enviar verificação de email')
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async function logout() {
    const currentUser = auth.currentUser
    if (currentUser && currentTripId) {
      try {
        const tripRef = doc(db, 'users', currentUser.uid, 'trips', currentTripId)
        await updateDoc(tripRef, {
          days: data, links, hotels, tours,
          updatedAt: serverTimestamp()
        })
      } catch (e) {
        console.warn('Não foi possível salvar antes de sair:', e.message)
      }
    }
    await signOut(auth)
    reset()
  }

  // ─── Recuperação de senha ─────────────────────────────────────────────────
  async function forgotPassword(email) {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: false,
    })
  }

  // ─── Mensagens de erro traduzidas ─────────────────────────────────────────
  function getErrorMessage(code) {
    const messages = {
      'auth/invalid-email':         'Email inválido',
      'auth/user-not-found':        'Usuário não encontrado',
      'auth/wrong-password':        'Senha incorreta',
      'auth/invalid-credential':    'Email ou senha inválidos',
      'auth/too-many-requests':     'Muitas tentativas. Tente novamente mais tarde.',
      'auth/email-already-in-use':  'Este email já está em uso',
      'auth/weak-password':         'Senha muito fraca (mínimo 6 caracteres)',
      'auth/operation-not-allowed': 'Cadastro por email/senha não está habilitado.',
    }
    return messages[code] || 'Erro desconhecido'
  }

  return { login, register, logout, forgotPassword, getErrorMessage }
}