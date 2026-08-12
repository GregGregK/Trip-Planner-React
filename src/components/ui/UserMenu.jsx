// src/components/ui/UserMenu.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import useTripStore from '../../store/useTripStore.js'
import ConfirmModal from './ConfirmModal'

export default function UserMenu() {
  const { logout } = useAuth()
  const currentUser  = useTripStore(s => s.currentUser)
  const currentTripId = useTripStore(s => s.currentTripId)
  const tripsList    = useTripStore(s => s.tripsList)
  const loadTripsList = useTripStore(s => s.loadTripsList)
  const switchTrip    = useTripStore(s => s.switchTrip)
  const createNewTrip = useTripStore(s => s.createNewTrip)

  const [open, setOpen]               = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [newTripName, setNewTripName] = useState('')
  const [creating, setCreating]       = useState(false)
  const dropdownRef = useRef(null)
  const btnRef      = useRef(null)

  const initial = currentUser?.email?.charAt(0).toUpperCase() ?? 'U'

  useEffect(() => {
    function onClickOutside(e) {
      if (!dropdownRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleToggle() {
    setOpen(prev => {
      const next = !prev
      if (next) loadTripsList()
      return next
    })
  }

  async function handleLogout() {
    setConfirmOpen(false)
    setOpen(false)
    await logout()
  }

  async function handleSwitchTrip(tripId) {
    if (tripId === currentTripId) { setOpen(false); return }
    await switchTrip(tripId)
    setOpen(false)
  }

  async function handleCreateTrip() {
    if (!newTripName.trim() || creating) return
    setCreating(true)
    await createNewTrip(newTripName.trim())
    setCreating(false)
    setNewTripName('')
    setOpen(false)
  }

  return (
    <>
      <div id="userMenuContainer">
        <button
          className="user-avatar-btn"
          ref={btnRef}
          onClick={handleToggle}
          title="Menu do usuário"
        >
          <span className="user-avatar">{initial}</span>
          <span className="user-email-small">{currentUser?.email ?? 'Usuário'}</span>
          <i
            className="ti ti-chevron-down"
            style={{ fontSize: 10, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {open && (
          <div className="user-dropdown" ref={dropdownRef}>
            <div className="user-dropdown-header">
              <div className="user-dropdown-avatar">{initial}</div>
              <div className="user-dropdown-info">
                <div className="user-dropdown-name">{currentUser?.displayName ?? 'Usuário'}</div>
                <div className="user-dropdown-email">{currentUser?.email ?? ''}</div>
              </div>
            </div>

            <div className="user-dropdown-divider" />

            <div className="user-dropdown-section-label">
              <i className="ti ti-luggage" /> Suas viagens
            </div>

            <div className="user-dropdown-trips">
              {tripsList.length === 0 && (
                <div className="trip-list-empty">Carregando…</div>
              )}
              {tripsList.map(trip => (
                <button
                  key={trip.id}
                  className={`trip-list-item${trip.id === currentTripId ? ' active' : ''}`}
                  onClick={() => handleSwitchTrip(trip.id)}
                >
                  <i className={`ti ${trip.id === currentTripId ? 'ti-check' : 'ti-map-2'}`} />
                  <span className="trip-list-item-name">{trip.name}</span>
                </button>
              ))}
            </div>

            <div className="trip-new-row">
              <input
                className="trip-new-input"
                placeholder="Nome da nova viagem"
                value={newTripName}
                onChange={e => setNewTripName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateTrip() }}
              />
              <button className="btn-icon" onClick={handleCreateTrip} disabled={creating} title="Criar viagem">
                <i className="ti ti-plus" />
              </button>
            </div>

            <div className="user-dropdown-divider" />

            <button
              className="user-dropdown-item user-dropdown-logout"
              onClick={() => setConfirmOpen(true)}
            >
              <i className="ti ti-logout" style={{ color: 'var(--danger)' }} />
              <span>Sair da conta</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Sair da conta"
        message="Tem certeza que deseja sair? Seus dados continuarão salvos na nuvem."
        confirmText="Sair"
        isDanger
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}