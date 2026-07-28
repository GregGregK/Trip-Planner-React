// src/components/ui/UserMenu.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import useTripStore from '../../store/useTripStore.js'
import ConfirmModal from './ConfirmModal'

export default function UserMenu() {
  const { logout } = useAuth()
  const currentUser = useTripStore(s => s.currentUser)
  const [open, setOpen]           = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const dropdownRef = useRef(null)
  const btnRef      = useRef(null)

  const initial = currentUser?.email?.charAt(0).toUpperCase() ?? 'U'

  // Fechar ao clicar fora
  useEffect(() => {
    function onClickOutside(e) {
      if (!dropdownRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Posicionar dropdown no mobile usando fixed
  function handleToggle() {
    setOpen(prev => !prev)
  }

  async function handleLogout() {
    setConfirmOpen(false)
    setOpen(false)
    await logout()
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

            <div className="user-dropdown-item" style={{ cursor: 'default' }}>
              <i className="ti ti-cloud-check" style={{ color: 'var(--accent)' }} />
              <span>Dados na nuvem</span>
              <span className="user-dropdown-badge">Ativo</span>
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