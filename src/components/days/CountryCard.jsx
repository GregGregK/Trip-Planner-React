// src/components/days/CountryCard.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { geocodeLocation, genId, DAY_TYPE_LIST } from '../../lib/utils'
import ActivityRow from './ActivityRow'
import ConfirmModal from '../ui/ConfirmModal'

export default function CountryCard({ country, ci, selectedDate, dayTypeFilter, flags, onUpdate, onDelete, onSave }) {
  const [showFlags,   setShowFlags]   = useState(false)
  const [geoStatus,   setGeoStatus]   = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showDup,     setShowDup]     = useState(false)

  const data     = useTripStore(s => s.data)
  const setDayData = useTripStore(s => s.setDayData)

  function addActivity() {
    const next = [...(country.activities || []), { id: genId(), name: '', time: '', type: 'tour', customType: '', description: '' }]
    onUpdate({ activities: next })
    onSave()
  }

  function updateActivity(ai, patch) {
    const next = (country.activities || []).map((a, i) => i === ai ? { ...a, ...patch } : a)
    onUpdate({ activities: next })
    onSave()
  }

  function deleteActivity(ai) {
    const next = (country.activities || []).filter((_, i) => i !== ai)
    onUpdate({ activities: next })
    onSave()
  }

  async function handleGeo() {
    const query = country.location || country.name || ''
    if (!query) { setGeoStatus('Sem localização'); return }
    setGeoStatus('Buscando…')
    const result = await geocodeLocation(query)
    if (result.success) onUpdate({ lat: result.lat, lng: result.lng })
    setGeoStatus(result.message)
    setTimeout(() => setGeoStatus(''), 2000)
  }

  // Drag & drop simplificado
  function onDragStart(e, ai) { e.dataTransfer.setData('text/plain', String(ai)) }
  function onDrop(e, targetAi) {
    e.preventDefault()
    const srcAi = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (srcAi === targetAi) return
    const acts = [...(country.activities || [])]
    const [moved] = acts.splice(srcAi, 1)
    acts.splice(targetAi, 0, moved)
    onUpdate({ activities: acts })
    onSave()
  }
  function onDragOver(e) { e.preventDefault() }

  const activities = country.activities || []

  return (
    <div className="country-card">
      {/* Header */}
      <div className="country-header">
        <div className="country-flag-wrap">
          <button className="country-flag-btn" onClick={() => setShowFlags(f => !f)} title="Mudar emoji">
            {country.flag || '🌍'}
          </button>
          {showFlags && (
            <div className="flag-picker">
              {flags.map(f => (
                <button key={f} onClick={() => { onUpdate({ flag: f }); onSave(); setShowFlags(false) }}>{f}</button>
              ))}
            </div>
          )}
        </div>
        <input
          className="country-name-input"
          value={country.name || ''}
          placeholder="Nome do país / cidade"
          onChange={e => { onUpdate({ name: e.target.value }); onSave() }}
        />
        <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={() => setConfirmOpen(true)}>
          <i className="ti ti-trash" />
        </button>
      </div>

      {/* Localização */}
      <div className="country-location-row">
        <i className="ti ti-map-pin" style={{ color: country.lat ? 'var(--accent)' : 'var(--muted)', fontSize: 13 }} />
        <input
          className="country-location-input"
          value={country.location || ''}
          placeholder="Localização para o mapa (cidade, país…)"
          onChange={e => { onUpdate({ location: e.target.value }); onSave() }}
        />
        <button
          className={`geo-btn${country.lat ? ' pinned' : ''}`}
          onClick={handleGeo}
        >
          <i className="ti ti-map-pin-2" /> Fixar pin
        </button>
        {geoStatus && <span className="geo-status">{geoStatus}</span>}
      </div>

      {/* Activities */}
      <div className="activities-list">
        {activities.map((a, ai) => {
          // Calcular se está dimmed pelo filtro
          let isDimmed = false
          if (dayTypeFilter !== 'all') {
            if (dayTypeFilter.startsWith('custom::')) {
              const label = dayTypeFilter.slice(8)
              isDimmed = !(a.type === 'custom' && (a.customType || 'Outro').trim() === label)
            } else {
              isDimmed = (a.type || 'tour') !== dayTypeFilter
            }
          }
          return (
            <ActivityRow
              key={a.id || ai}
              activity={a}
              isDimmed={isDimmed}
              onUpdate={(patch) => updateActivity(ai, patch)}
              onDelete={() => deleteActivity(ai)}
              onDragStart={(e) => onDragStart(e, ai)}
              onDrop={(e) => onDrop(e, ai)}
              onDragOver={onDragOver}
            />
          )
        })}
      </div>

      {/* Footer */}
      <div className="country-footer">
        <button className="btn btn-sm" onClick={addActivity}>
          <i className="ti ti-plus" /> Adicionar item
        </button>
        <button className="btn btn-sm" onClick={() => setShowDup(d => !d)}>
          <i className="ti ti-copy" /> Duplicar para os próximos dias
        </button>
      </div>

      {/* Duplicar popover */}
      {showDup && (
        <DuplicatePopover
          country={country}
          selectedDate={selectedDate}
          data={data}
          setDayData={setDayData}
          onSave={onSave}
          onClose={() => setShowDup(false)}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Remover país"
        message={`Remover "${country.name || 'este país'}" e todas as suas atividades?`}
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => { setConfirmOpen(false); onDelete() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function DuplicatePopover({ country, selectedDate, data, setDayData, onSave, onClose }) {
  const [endDate, setEndDate] = useState('')
  const [days,    setDays]    = useState(1)

  function duplicate(numDays) {
    const [y, m, d] = selectedDate.split('-').map(Number)
    for (let i = 1; i <= numDays; i++) {
      const next = new Date(y, m - 1, d + i)
      const key  = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
      const existing = data[key] || []
      const clone = { ...country, id: genId(), activities: (country.activities || []).map(a => ({ ...a, id: genId() })) }
      setDayData(key, [...existing, clone])
    }
    onSave()
    onClose()
  }

  function duplicateToDate() {
    if (!endDate) return
    const start = new Date(selectedDate)
    const end   = new Date(endDate)
    const diff  = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (diff > 0) duplicate(diff)
  }

  return (
    <div className="dup-popover">
      <div className="dup-popover-title">Duplicar para os próximos dias</div>
      <div className="dup-quick">
        {[1, 3, 7].map(n => (
          <button key={n} className="btn btn-sm" onClick={() => duplicate(n)}>+{n} dia{n > 1 ? 's' : ''}</button>
        ))}
      </div>
      <div className="dup-date-row">
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={selectedDate} />
        <button className="btn btn-sm btn-accent" onClick={duplicateToDate}>Duplicar até esta data</button>
      </div>
      <button className="btn-icon dup-close" onClick={onClose}><i className="ti ti-x" /></button>
    </div>
  )
}