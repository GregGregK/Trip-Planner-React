// src/hooks/useAuth.js
import { useEffect, useState } from 'react'
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
import { auth, db } from '../lib/firebase.js'
import useTripStore from '../store/useTripStore.js'

export function useAuth() {
  const [authReady, setAuthReady] = useState(false)
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
    isLoading: storeLoading,
    isInitialized,
    currentUser,
  } = useTripStore()

  // ─── Listener de autenticação ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    let isProcessing = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Prevenir processamento simultâneo
      if (isProcessing) {
        console.log('⏳ Auth change already processing, skipping...')
        return
      }

      if (!isMounted) return

      console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user')

      isProcessing = true

      try {
        if (user) {
          // Verificar se o usuário já está setado e inicializado para evitar loop
          const state = useTripStore.getState()
          if (state.currentUser?.uid === user.uid && state.isInitialized) {
            console.log('✅ User already loaded and initialized, skipping...')
            setAuthReady(true)
            isProcessing = false
            return
          }

          setCurrentUser(user)
          await loadUserTrip(user)
        } else {
          reset()
        }
      } catch (error) {
        console.error('❌ Error in auth listener:', error)
        reset()
      } finally {
        if (isMounted) {
          setAuthReady(true)
        }
        isProcessing = false
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, []) // Sem dependências para executar apenas uma vez

  // ─── Login ────────────────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      console.log('🔑 Attempting login for:', email)
      await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Login successful')
    } catch (error) {
      console.error('❌ Login error:', error.code)
      throw error
    }
  }

  // ─── Registro ─────────────────────────────────────────────────────────────
  async function register(name, email, password) {
    try {
      console.log('📝 Attempting registration for:', email)
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: name })
      await createUserDoc(credential.user.uid, name, email)

      try {
        await sendEmailVerification(credential.user)
        console.log('📧 Verification email sent')
      } catch {
        console.warn('Could not send verification email')
      }
    } catch (error) {
      console.error('❌ Registration error:', error.code)
      throw error
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async function logout() {
    try {
      console.log('🚪 Logging out')
      const currentUser = auth.currentUser
      if (currentUser && currentTripId) {
        try {
          const tripRef = doc(db, 'users', currentUser.uid, 'trips', currentTripId)
          await updateDoc(tripRef, {
            days: data,
            links,
            hotels,
            tours,
            updatedAt: serverTimestamp()
          })
          console.log('💾 Data saved before logout')
        } catch (e) {
          console.warn('Could not save before logout:', e.message)
        }
      }
      await signOut(auth)
      reset()
    } catch (error) {
      console.error('❌ Logout error:', error)
      throw error
    }
  }

  // ─── Recuperação de senha ─────────────────────────────────────────────────
  async function forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: false,
      })
    } catch (error) {
      console.error('❌ Forgot password error:', error.code)
      throw error
    }
  }

  // ─── Mensagens de erro traduzidas ─────────────────────────────────────────
  function getErrorMessage(code) {
    const messages = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-credential': 'Email ou senha inválidos',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/email-already-in-use': 'Este email já está em uso',
      'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
      'auth/operation-not-allowed': 'Cadastro por email/senha não está habilitado.',
    }
    return messages[code] || `Erro: ${code}`
  }

  // Determinar o estado de loading combinado
  const isLoading = !authReady || storeLoading

  return {
    login,
    register,
    logout,
    forgotPassword,
    getErrorMessage,
    isLoading,
    authReady,
  }
}