// src/App.jsx
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth.js'
import useTripStore from './store/useTripStore.js'
import AuthScreen from './components/ui/AuthScreen.jsx'
import Sidebar from './components/sidebar/Sidebar'
import UserMenu from './components/ui/UserMenu.jsx'
import SaveStatus from './components/ui/SaveStatus.jsx'
import DaysPanel from './components/days/DaysPanel.jsx'
import ToursPanel from './components/tours/ToursPanel.jsx'
import LinksPanel from './components/links/LinksPanel.jsx'
import HotelsPanel from './components/hotels/HotelsPanel.jsx'
import MapPanel from './components/map/MapPanel.jsx'
import GuidePanel from './components/guide/GuidePanel.jsx'

const TABS = [
  { id: 'days', label: 'Dias', icon: 'ti-calendar' },
  { id: 'tours', label: 'Passeios', icon: 'ti-map' },
  { id: 'links', label: 'Links', icon: 'ti-link' },
  { id: 'hotels', label: 'Hotéis', icon: 'ti-bed' },
  { id: 'map', label: 'Mapa', icon: 'ti-map-2' },
  { id: 'guide', label: 'Guia', icon: 'ti-notes' },
]

export default function App() {
  const { isLoading, authReady, login, register, forgotPassword, getErrorMessage } = useAuth()
  const currentUser = useTripStore(s => s.currentUser)
  const isInitialized = useTripStore(s => s.isInitialized)
  const currentTab = useTripStore(s => s.currentTab)
  const setCurrentTab = useTripStore(s => s.setCurrentTab)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)

  // ESC fecha modais globais
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove())
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Mostrar loading enquanto autentica ou carrega dados
  if (!authReady || isLoading || (currentUser && !isInitialized)) {
    return (
      <div className="auth-screen">
        <div className="auth-container">
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            <div style={{
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
              fontSize: 32,
              marginBottom: 12
            }}>
              <i className="ti ti-loader" />
            </div>
            <p>Carregando sua viagem...</p>
            {currentUser && (
              <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                Conectado como {currentUser.email}
              </p>
            )}
            {!authReady && (
              <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                Autenticando...
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <AuthScreen
        login={login}
        register={register}
        forgotPassword={forgotPassword}
        getErrorMessage={getErrorMessage}
        isLoading={isLoading}
      />
    )
  }

  function handleTabClick(tabId) {
    if (tabId === 'days') setSelectedDate(null)
    setCurrentTab(tabId)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-text">
            <div className="app-title">
              <i className="ti ti-map-2" /> Planejador de Viagem
            </div>
            <div className="app-subtitle">Organize países, passeios e horários</div>
          </div>
          <button
            className="sidebar-toggle"
            id="sidebarToggle"
            title="Expandir/Recolher calendário"
          >
            <i className="ti ti-chevron-up" />
          </button>
        </div>

        <UserMenu />
        <SaveStatus />

        <div className="sidebar-collapsible" id="sidebarCollapsible">
          <Sidebar />
        </div>
      </aside>

      <main className="main">
        <div className="main-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${currentTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <i className={`ti ${tab.icon}`} /> {tab.label}
            </button>
          ))}
        </div>

        <div className={`tab-panel${currentTab === 'days' ? ' active' : ''}`}><DaysPanel /></div>
        <div className={`tab-panel${currentTab === 'tours' ? ' active' : ''}`}><ToursPanel /></div>
        <div className={`tab-panel${currentTab === 'links' ? ' active' : ''}`}><LinksPanel /></div>
        <div className={`tab-panel${currentTab === 'hotels' ? ' active' : ''}`}><HotelsPanel /></div>
        <div className={`tab-panel${currentTab === 'map' ? ' active' : ''}`}>
          <MapPanel active={currentTab === 'map'} />
        </div>
        <div className={`tab-panel${currentTab === 'guide' ? ' active' : ''}`}><GuidePanel /></div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}