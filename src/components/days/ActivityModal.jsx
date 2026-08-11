// src/components/days/ActivityModal.jsx
import { useState, useEffect } from 'react'

export default function ActivityModal({ open, activity, tours, hotels, onSave, onClose }) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [linkKey, setLinkKey] = useState('')

  useEffect(() => {
    if (!activity) return
    setName(activity.name || '')
    setTime(activity.time || '')
    setDescription(activity.description || '')
    setLinkKey(
      activity.linkType === 'arrival' || activity.linkType === 'departure'
        ? activity.linkType
        : (activity.linkType && activity.linkId ? `${activity.linkType}:${activity.linkId}` : '')
    )
  }, [activity, open])

  if (!open || !activity) return null

  function handleSave() {
    let linkType = null, linkId = null
    if (linkKey === 'arrival' || linkKey === 'departure') {
      linkType = linkKey
    } else if (linkKey) {
      const [kind, id] = linkKey.split(':')
      linkType = kind
      linkId = id
    }
    onSave({ name, time, description, linkType, linkId })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><i className="ti ti-x" /></button>
        <div className="modal-title"><i className="ti ti-notes" /> Editar item</div>
        <div className="modal-divider" />

        <div className="activity-modal-row">
          <div className="activity-modal-field" style={{ maxWidth: 110 }}>
            <label>Horário</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="activity-modal-field">
            <label>Nome</label>
            <input value={name} placeholder="Nome do item" onChange={e => setName(e.target.value)} />
          </div>
        </div>

        <div className="activity-modal-field">
          <label>Vincular a</label>

          <select value={linkKey} onChange={e => setLinkKey(e.target.value)}>
            <option value="">Nenhum (item avulso)</option>
            <option value="arrival">🛬 Chegada no país</option>
            <option value="departure">🛫 Saída do país</option>
            {tours.length > 0 && (
              <optgroup label="Passeios">
                {tours.map(t => <option key={`tour:${t.id}`} value={`tour:${t.id}`}>{t.name || 'Passeio sem nome'}</option>)}
              </optgroup>
            )}
            {hotels.length > 0 && (
              <optgroup label="Hotéis">
                {hotels.map(h => <option key={`hotel:${h.id}`} value={`hotel:${h.id}`}>{h.name || 'Hotel sem nome'}</option>)}
              </optgroup>
            )}
          </select>
        </div>

        <div className="activity-modal-field">
          <label>Descrição detalhada</label>
          <textarea value={description} placeholder="Anotações, detalhes, endereço, o que levar…" onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-sm btn-accent" onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  )
}