// src/components/tours/ToursPanel.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { getAllDayOptions, geocodeLocation, genId, fmtDate } from '../../lib/utils'
import ConfirmModal from '../ui/ConfirmModal'

export default function ToursPanel() {
  const tours      = useTripStore(s => s.tours)
  const data       = useTripStore(s => s.data)
  const hotels     = useTripStore(s => s.hotels)
  const addTour    = useTripStore(s => s.addTour)
  const updateTour = useTripStore(s => s.updateTour)
  const deleteTour = useTripStore(s => s.deleteTour)
  const save       = useTripStore(s => s.save)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)
  const setCurrentTab   = useTripStore(s => s.setCurrentTab)

  const [dayFilter,  setDayFilter]  = useState('all')
  const [confirmIdx, setConfirmIdx] = useState(null)
  const [geoStatus,  setGeoStatus]  = useState({})

  const dayOptions = getAllDayOptions('', { data, tours, hotels })

  // Dias com passeios vinculados (para o filtro)
  const linkedDays = [...new Set(tours.filter(t => t.linkedDay).map(t => t.linkedDay))].sort()

  const visible = tours
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => dayFilter === 'all' || t.linkedDay === dayFilter)

  function handleAdd() {
    addTour({ id: genId(), name: '', time: '', linkedDay: '', url: '', location: '', note: '', lat: null, lng: null })
    save()
  }

  function handleUpdate(idx, patch) {
    updateTour(idx, patch)
    save()
  }

  function handleDelete(idx) {
    deleteTour(idx)
    save()
    setConfirmIdx(null)
  }

  async function handleGeo(idx) {
    const t = tours[idx]
    const query = t.location || t.name || ''
    if (!query) { setGeoStatus(s => ({ ...s, [idx]: 'Sem localização' })); return }
    setGeoStatus(s => ({ ...s, [idx]: 'Buscando…' }))
    const result = await geocodeLocation(query)
    if (result.success) handleUpdate(idx, { lat: result.lat, lng: result.lng })
    setGeoStatus(s => ({ ...s, [idx]: result.message }))
    setTimeout(() => setGeoStatus(s => ({ ...s, [idx]: '' })), 2000)
  }

  function goToDay(key) {
    const [y, m] = key.split('-').map(Number)
    useTripStore.getState().setViewYear(y)
    useTripStore.getState().setViewMonth(m - 1)
    setSelectedDate(key)
    setCurrentTab('days')
  }

  function hrefFor(url) {
    if (!url) return '#'
    return url.startsWith('http') ? url : 'https://' + url
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="links-header">
        <div>
          <div className="links-header-title">Passeios</div>
          <div className="links-header-sub">Organize seus passeios com descrição, horário, links e dia vinculado</div>
        </div>
        <button className="btn btn-accent" onClick={handleAdd}>
          <i className="ti ti-plus" /> Adicionar passeio
        </button>
      </div>

      {/* Filter by day */}
      {linkedDays.length > 0 && (
        <div className="filter-bar">
          <span className="filter-bar-label">Filtrar:</span>
          <button className={`filter-chip${dayFilter === 'all' ? ' active' : ''}`} onClick={() => setDayFilter('all')}>
            Todos <span className="fc-count">{tours.length}</span>
          </button>
          {linkedDays.map(key => (
            <button
              key={key}
              className={`filter-chip${dayFilter === key ? ' active' : ''}`}
              onClick={() => setDayFilter(key)}
            >
              {fmtDate(key)} <span className="fc-count">{tours.filter(t => t.linkedDay === key).length}</span>
            </button>
          ))}
        </div>
      )}

      {tours.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-map empty-icon" />
          <div className="empty-title">Nenhum passeio adicionado</div>
          <div className="empty-sub">Adicione passeios para organizar seus roteiros.</div>
        </div>
      )}

      <div className="tours-list">
  {visible.map(({ t, i }) => (
    <div key={t.id || i} className="tour-card">
      <div className="tour-top-row">
        <div className="tour-icon"><i className="ti ti-map" /></div>
        <input
          className="tour-name-input"
          value={t.name || ''}
          placeholder="Nome do passeio"
          onChange={e => handleUpdate(i, { name: e.target.value })}
        />
        <div className="tour-actions">
          <a
            className="link-open-btn"
            href={hrefFor(t.url)}
            target="_blank"
            rel="noopener noreferrer"
            style={!t.url ? { opacity: 0.3, pointerEvents: 'none' } : {}}
          >
            <i className="ti ti-external-link" />
          </a>
          <button className="btn-icon" onClick={() => setConfirmIdx(i)}>
            <i className="ti ti-trash" />
          </button>
        </div>
      </div>

      <div className="tour-field-row">
        <i className="ti ti-clock" />
        <input
          type="time"
          className="tour-time-input"
          value={t.time || ''}
          onChange={e => handleUpdate(i, { time: e.target.value })}
        />
        <i className="ti ti-calendar-event" />
        <select
          className={`tour-day-select${t.linkedDay ? ' has-day' : ''}`}
          value={t.linkedDay || ''}
          onChange={e => handleUpdate(i, { linkedDay: e.target.value })}
        >
          {dayOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {t.linkedDay && (
          <button
            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => goToDay(t.linkedDay)}
          >
            Ver dia →
          </button>
        )}
      </div>

      <div className="tour-field-row">
        <i className="ti ti-link" />
        <input
          className="tour-link-input"
          value={t.url || ''}
          placeholder="Link do passeio (https://…)"
          onChange={e => handleUpdate(i, { url: e.target.value })}
        />
      </div>

      <div className="tour-field-row">
        <i className="ti ti-map-pin" />
        <input
          className="tour-text-input"
          value={t.location || ''}
          placeholder="Localização / ponto de encontro"
          onChange={e => handleUpdate(i, { location: e.target.value })}
        />
        <button
          className={`geo-btn${t.lat ? ' pinned' : ''}`}
          onClick={() => handleGeo(i)}
          title="Fixar pin no mapa"
        >
          <i className="ti ti-map-pin-2" /> Fixar pin
        </button>
        {geoStatus[i] && <span className="geo-status">{geoStatus[i]}</span>}
      </div>

      <div className="tour-field-row">
        <i className="ti ti-notes" />
        <textarea
          className="tour-note-input"
          value={t.note || ''}
          placeholder="Descrição, observações…"
          rows={2}
          onChange={e => handleUpdate(i, { note: e.target.value })}
        />
      </div>
    </div>
  ))}
</div>

      <ConfirmModal
        open={confirmIdx !== null}
        title="Remover passeio"
        message="Tem certeza que deseja remover este passeio?"
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => handleDelete(confirmIdx)}
        onCancel={() => setConfirmIdx(null)}
      />
    </div>
  )
}