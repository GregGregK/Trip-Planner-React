// src/components/ui/ConfirmModal.jsx
import { useEffect, useRef } from 'react'

export default function ConfirmModal({
  open,
  title       = 'Confirmar ação',
  message     = '',
  confirmText = 'Confirmar',
  cancelText  = 'Cancelar',
  isDanger    = false,
  onConfirm,
  onCancel,
}) {
  const okRef = useRef(null)

  // Focar no botão ao abrir / ESC para cancelar
  useEffect(() => {
    if (!open) return
    setTimeout(() => okRef.current?.focus(), 50)
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 10001 }}>
      <div className="modal-box" style={{ maxWidth: 420, padding: 24 }}>
        <div className="modal-title" style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{isDanger ? '⚠️' : '💡'}</span>
          <span>{title}</span>
        </div>

        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px' }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={okRef}
            className={`btn btn-sm${!isDanger ? ' btn-accent' : ''}`}
            style={isDanger ? { background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)', padding: '8px 16px' } : { padding: '8px 16px' }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}