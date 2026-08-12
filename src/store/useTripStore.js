// src/store/useTripStore.js
import { create } from 'zustand'
import { db } from '../lib/firebase'
import {
  doc, collection,
  setDoc, updateDoc, addDoc, getDoc,
  serverTimestamp, orderBy, limit, query,
  getDocs,
} from 'firebase/firestore'

// ─── Debounce helper ──────────────────────────────────────────────────────────
let saveTimeout = null
const SAVE_DELAY = 1000

const useTripStore = create((set, get) => ({
  // ─── Estado ───────────────────────────────────────────────────────────────
  data: {},
  links: [],
  hotels: [],
  tours: [],

  currentUser: null,
  currentTripId: null,
  tripsList: [], // [{ id, name, updatedAt }]
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  saveStatus: 'idle',

  // UI state
  selectedDate: null,
  currentTab: 'days',
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),

  // ─── UI actions ───────────────────────────────────────────────────────────
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setViewYear: (y) => set({ viewYear: y }),
  setViewMonth: (m) => set({ viewMonth: m }),
  setCurrentUser: (user) => set({ currentUser: user }),

  // ─── Data mutations ───────────────────────────────────────────────────────
  setDayData: (dateKey, countries) =>
    set(state => ({ data: { ...state.data, [dateKey]: countries } })),

  deleteDayData: (dateKey) =>
    set(state => {
      const next = { ...state.data }
      delete next[dateKey]
      return { data: next }
    }),

  setLinks: (links) => set({ links }),
  setHotels: (hotels) => set({ hotels }),
  setTours: (tours) => set({ tours }),

  addLink: (link) => set(state => ({ links: [...state.links, link] })),
  addHotel: (hotel) => set(state => ({ hotels: [...state.hotels, hotel] })),
  addTour: (tour) => set(state => ({ tours: [...state.tours, tour] })),

  updateLink: (idx, patch) =>
    set(state => {
      const next = [...state.links]
      next[idx] = { ...next[idx], ...patch }
      return { links: next }
    }),

  updateHotel: (idx, patch) =>
    set(state => {
      const next = [...state.hotels]
      next[idx] = { ...next[idx], ...patch }
      return { hotels: next }
    }),

  updateTour: (idx, patch) =>
    set(state => {
      const next = [...state.tours]
      next[idx] = { ...next[idx], ...patch }
      return { tours: next }
    }),

  deleteLink: (idx) => set(state => ({ links: state.links.filter((_, i) => i !== idx) })),
  deleteHotel: (idx) => set(state => ({ hotels: state.hotels.filter((_, i) => i !== idx) })),
  deleteTour: (idx) => set(state => ({ tours: state.tours.filter((_, i) => i !== idx) })),

  updateCountryActivities: (dateKey, countryIdx, activities) =>
    set(state => {
      const next = { ...state.data }
      next[dateKey] = next[dateKey].map((c, i) =>
        i === countryIdx ? { ...c, activities } : c
      )
      return { data: next }
    }),

  // ─── Save (debounced) ─────────────────────────────────────────────────────
  save: () => {
    const { currentUser, currentTripId, isLoading, isInitialized } = get()
    if (!currentUser || !currentTripId || isLoading || !isInitialized) return

    set({ saveStatus: 'saving' })
    if (saveTimeout) clearTimeout(saveTimeout)

    saveTimeout = setTimeout(async () => {
      const { data, links, hotels, tours, isSaving } = get()
      const { currentUser, currentTripId } = get()
      if (isSaving) return
      set({ isSaving: true })

      try {
        const tripRef = doc(db, 'users', currentUser.uid, 'trips', currentTripId)
        await updateDoc(tripRef, {
          days: data, links, hotels, tours,
          updatedAt: serverTimestamp()
        })
        set({ saveStatus: 'saved' })

        try {
          localStorage.setItem('trip_planner_backup', JSON.stringify({ days: data, links, hotels, tours }))
        } catch { /* localStorage cheio */ }

        setTimeout(() => set({ saveStatus: 'idle' }), 2000)

      } catch (error) {
        console.error('Erro ao salvar:', error)

        if (error.code === 'not-found') {
          try {
            const { data, links, hotels, tours } = get()
            const tripRef = doc(db, 'users', currentUser.uid, 'trips', currentTripId)
            await setDoc(tripRef, {
              name: 'Minha Viagem', days: data, links, hotels, tours,
              createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            })
            set({ saveStatus: 'saved' })
            setTimeout(() => set({ saveStatus: 'idle' }), 2000)
          } catch (retryError) {
            console.error('Erro ao criar documento:', retryError)
            set({ saveStatus: 'error' })
          }
        } else {
          set({ saveStatus: 'error' })
          setTimeout(() => set({ saveStatus: 'idle' }), 3000)
        }
      } finally {
        set({ isSaving: false })
      }
    }, SAVE_DELAY)
  },

  // ─── Carregar viagem do Firestore (a mais recente) ─────────────────────────
  loadUserTrip: async (user) => {
    // Evita recarregar à toa se já está tudo pronto pro mesmo usuário
    const state = get()
    if (state.isInitialized && state.currentUser?.uid === user.uid) {
      console.log('⏭️ Trip already loaded, skipping...')
      return
    }

    console.log('🔄 Loading trip for user:', user?.uid)
    set({ isLoading: true, isInitialized: false })

    // Timeout de segurança para não ficar preso
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Load trip timeout - forcing loading to false')
      set({ isLoading: false, isInitialized: true })
    }, 10000) // 10 segundos

    try {
      const tripsRef = collection(db, 'users', user.uid, 'trips')
      const q = query(tripsRef, orderBy('createdAt', 'desc'), limit(1))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const tripDoc = snapshot.docs[0]
        const tripData = tripDoc.data()
        console.log('✅ Trip loaded:', tripDoc.id)
        set({
          currentTripId: tripDoc.id,
          data: tripData.days || {},
          links: tripData.links || [],
          hotels: tripData.hotels || [],
          tours: tripData.tours || [],
        })
      } else {
        console.log('📝 Creating new trip for user')
        const tripsColRef = collection(db, 'users', user.uid, 'trips')
        const newTrip = await addDoc(tripsColRef, {
          name: 'Minha Viagem',
          days: {},
          links: [],
          hotels: [],
          tours: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log('✅ New trip created:', newTrip.id)
        set({
          currentTripId: newTrip.id,
          data: {},
          links: [],
          hotels: [],
          tours: [],
        })
      }

      // Resetar loading e marcar como inicializado
      clearTimeout(timeoutId)
      set({
        isInitialized: true,
        isLoading: false,
        saveStatus: 'idle'
      })

      // Popular a lista de viagens pro seletor
      get().loadTripsList()

    } catch (error) {
      console.error('❌ Error loading trip:', error)
      clearTimeout(timeoutId)

      // Tentar carregar do localStorage
      try {
        const backup = localStorage.getItem('trip_planner_backup')
        if (backup) {
          const parsed = JSON.parse(backup)
          console.log('💾 Loaded from backup')
          set({
            data: parsed.days || {},
            links: parsed.links || [],
            hotels: parsed.hotels || [],
            tours: parsed.tours || [],
          })
        }
      } catch (backupError) {
        console.warn('No backup available')
      }

      // SEMPRE resetar loading em caso de erro
      set({
        currentTripId: 'offline',
        isInitialized: true,
        isLoading: false,
        saveStatus: 'error'
      })
    }
  },

  // ─── Listar todas as viagens do usuário ────────────────────────────────────
  loadTripsList: async () => {
    const { currentUser } = get()
    if (!currentUser) return
    try {
      const tripsRef = collection(db, 'users', currentUser.uid, 'trips')
      const q = query(tripsRef, orderBy('updatedAt', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name || 'Viagem sem nome',
        updatedAt: d.data().updatedAt,
      }))
      set({ tripsList: list })
    } catch (error) {
      console.error('Erro ao listar viagens:', error)
    }
  },

  // ─── Trocar de viagem ───────────────────────────────────────────────────────
  switchTrip: async (tripId) => {
    const { currentUser, currentTripId } = get()
    if (!currentUser || tripId === currentTripId) return

    set({ isLoading: true, isInitialized: false })
    try {
      const tripRef = doc(db, 'users', currentUser.uid, 'trips', tripId)
      const snap = await getDoc(tripRef)
      if (snap.exists()) {
        const tripData = snap.data()
        set({
          currentTripId: tripId,
          data:   tripData.days   || {},
          links:  tripData.links  || [],
          hotels: tripData.hotels || [],
          tours:  tripData.tours  || [],
          selectedDate: null,
          currentTab: 'days',
        })
      }
      set({ isInitialized: true, saveStatus: 'idle' })
    } catch (error) {
      console.error('Erro ao trocar de viagem:', error)
      set({ saveStatus: 'error' })
    } finally {
      set({ isLoading: false })
    }
  },

  // ─── Criar nova viagem ────────────────────────────────────────────────────
  createNewTrip: async (name) => {
    const { currentUser } = get()
    if (!currentUser) return
    set({ isLoading: true })
    try {
      const tripsColRef = collection(db, 'users', currentUser.uid, 'trips')
      const newTrip = await addDoc(tripsColRef, {
        name: name?.trim() || 'Nova Viagem',
        days: {}, links: [], hotels: [], tours: [],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      set({
        currentTripId: newTrip.id,
        data: {}, links: [], hotels: [], tours: [],
        selectedDate: null, currentTab: 'days',
        isInitialized: true, saveStatus: 'idle',
      })
      await get().loadTripsList()
    } catch (error) {
      console.error('Erro ao criar viagem:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // ─── Criar usuário no Firestore ───────────────────────────────────────────
  createUserDoc: async (uid, name, email) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        name, email, createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Erro ao criar documento do usuário:', error)
    }
  },

  // ─── Reset ao fazer logout ────────────────────────────────────────────────
  reset: () => set({
    data: {}, links: [], hotels: [], tours: [],
    currentUser: null, currentTripId: null, tripsList: [],
    isInitialized: false, selectedDate: null,
    saveStatus: 'idle', isLoading: false
  }),
}))

export default useTripStore