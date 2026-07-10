// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAZDWWgwBa3SxRKwpgE5wngvfqNwd2zn_0",
  authDomain: "trip-planner-bc3f9.firebaseapp.com",
  projectId: "trip-planner-bc3f9",
  storageBucket: "trip-planner-bc3f9.firebasestorage.app",
  messagingSenderId: "773438000028",
  appId: "1:773438000028:web:cb68ee7f07078740731659"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Persistência offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistência offline indisponível (múltiplas abas abertas)')
  } else if (err.code === 'unimplemented') {
    console.warn('Navegador não suporta persistência offline')
  }
})