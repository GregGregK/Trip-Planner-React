// src/components/days/CountryCard.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { geocodeLocation, genId } from '../../lib/utils'
import ActivityRow from './ActivityRow'
import ActivityModal from './ActivityModal'
import ConfirmModal from '../ui/ConfirmModal'

export default function CountryCard({
  country, selectedDate, dayTypeFilter, flags, tours, hotels,
  onUpdate, onDelete, onSave, onMoveUp, onMoveDown, isFirst, isLast,
}) {
  const [showFlags,      setShowFlags]      = useState(false)
  const [confirmOpen,    setConfirmOpen]    = useState(false)
  const [showDup,        setShowDup]        = useState(false)
  const [confirmCityIdx, setConfirmCityIdx] = useState(null)
  const [openActivity,   setOpenActivity]   = useState(null) // { cityIdx, actIdx }
  const [geoStatus,      setGeoStatus]      = useState({})   // { [cityIdx]: 'Buscando…' }

  const data       = useTripStore(s => s.data)
  const setDayData = useTripStore(s => s.setDayData)

  const cities = country.cities || []

  function updateCity(ci, patch) {
    const next = cities.map((c, i) => i === ci ? { ...c, ...patch } : c)
    onUpdate({ cities: next })
    onSave()
  }

  function addCity() {
    const next = [...cities, { id: genId(), name: '', location: '', lat: null, lng: null, activities: [] }]
    onUpdate({ cities: next })
    onSave()
  }

  function deleteCity(ci) {
    const next = cities.filter((_, i) => i !== ci)
    onUpdate({ cities: next })
    onSave()
    setConfirmCityIdx(null)
  }

  async function handleGeo(ci) {
    const city = cities[ci]
    const query = city.location || city.name || ''
    if (!query) { setGeoStatus(s => ({ ...s, [ci]: 'Sem localização' })); return }
    setGeoStatus(s => ({ ...s, [ci]: 'Buscando…' }))
    const result = await geocodeLocation(query)
    if (result.success) updateCity(ci, { lat: result.lat, lng: result.lng })
    setGeoStatus(s => ({ ...s, [ci]: result.message }))
    setTimeout(() => setGeoStatus(s => ({ ...s, [ci]: '' })), 2000)
  }

  function addActivity(ci) {
    const city = cities[ci]
    const next = [...(city.activities || []), { id: genId(), name: '', time: '', description: '', linkType: null, linkId: null }]
    updateCity(ci, { activities: next })
  }

  function updateActivity(ci, ai, patch) {
    const city = cities[ci]
    const next = (city.activities || []).map((a, i) => i === ai ? { ...a, ...patch } : a)
    updateCity(ci, { activities: next })
  }

  function deleteActivity(ci, ai) {
    const city = cities[ci]
    const next = (city.activities || []).filter((_, i) => i !== ai)
    updateCity(ci, { activities: next })
  }

  function getLinkedEntity(activity) {
    if (!activity.linkType || !activity.linkId) return null
    const list = activity.linkType === 'tour' ? tours : hotels
    const found = (list || []).find(x => x.id === activity.linkId)
    if (!found) return null
    return { kind: activity.linkType, name: found.name || (activity.linkType === 'tour' ? 'Passeio' : 'Hotel') }
  }

  function onDragStart(e, ai) { e.dataTransfer.setData('text/plain', String(ai)) }
  function onDrop(e, ci, targetAi) {
    e.preventDefault()
    const srcAi = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (srcAi === targetAi) return
    const city = cities[ci]
    const acts = [...(city.activities || [])]
    const [moved] = acts.splice(srcAi, 1)
    acts.splice(targetAi, 0, moved)
    updateCity(ci, { activities: acts })
  }
  function onDragOver(e) { e.preventDefault() }

  const openActivityObj = openActivity ? cities[openActivity.cityIdx]?.activities?.[openActivity.actIdx] : null

  return (
    <div className="country-card">
      <div className="country-header">
        <div className="country-reorder">
          <button className="country-reorder-btn" disabled={isFirst} onClick={onMoveUp} title="Mover para cima">
            <i className="ti ti-chevron-up" />
          </button>
          <button className="country-reorder-btn" disabled={isLast} onClick={onMoveDown} title="Mover para baixo">
            <i className="ti ti-chevron-down" />
          </button>
        </div>

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
          className="country-name"
          value={country.name || ''}
          placeholder="Nome do país"
          onChange={e => { onUpdate({ name: e.target.value }); onSave() }}
        />
        <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={() => setConfirmOpen(true)}>
          <i className="ti ti-trash" />
        </button>
      </div>

      {cities.length === 0 && (
        <div className="city-empty-hint">Nenhuma cidade adicionada ainda.</div>
      )}

      {cities.map((city, ci) => (
        <div key={city.id || ci} className="city-block">
          <div className="city-header">
            <i className="ti ti-map-pin-filled" style={{ color: 'var(--muted)', fontSize: 13 }} />
            <input
              className="city-name-input"
              value={city.name || ''}
              placeholder="Nome da cidade"
              onChange={e => updateCity(ci, { name: e.target.value })}
            />
            <button className="btn-icon" onClick={() => setConfirmCityIdx(ci)}>
              <i className="ti ti-trash" />
            </button>
          </div>

          <div className="city-location-row">
            <i className="ti ti-map-pin" style={{ color: city.lat ? 'var(--accent)' : 'var(--muted)', fontSize: 13 }} />
            <input
              className="location-input"
              value={city.location || ''}
              placeholder="Localização para o mapa"
              onChange={e => updateCity(ci, { location: e.target.value })}
            />
            <button className={`geo-btn${city.lat ? ' pinned' : ''}`} onClick={() => handleGeo(ci)}>
              <i className="ti ti-map-pin-2" /> Fixar pin
            </button>
            {geoStatus[ci] && <span className="geo-status">{geoStatus[ci]}</span>}
          </div>

          <div className="activities">
            {(city.activities || []).map((a, ai) => {
              const linkedEntity = getLinkedEntity(a)
              let isDimmed = false
              if (dayTypeFilter !== 'all') isDimmed = (a.linkType || 'none') !== dayTypeFilter
              return (
                <ActivityRow
                  key={a.id || ai}
                  activity={a}
                  isDimmed={isDimmed}
                  linkedEntity={linkedEntity}
                  onOpen={() => setOpenActivity({ cityIdx: ci, actIdx: ai })}
                  onDelete={() => deleteActivity(ci, ai)}
                  onDragStart={(e) => onDragStart(e, ai)}
                  onDrop={(e) => onDrop(e, ci, ai)}
                  onDragOver={onDragOver}
                />
              )
            })}
          </div>

          <div className="city-footer">
            <button className="btn btn-sm" onClick={() => addActivity(ci)}>
              <i className="ti ti-plus" /> Adicionar item
            </button>
          </div>
        </div>
      ))}

      <button className="add-city-btn" onClick={addCity}>
        <i className="ti ti-plus" /> Adicionar cidade
      </button>

      <div className="country-footer">
        <button className="btn btn-sm" onClick={() => setShowDup(d => !d)}>
          <i className="ti ti-copy" /> Duplicar para os próximos dias
        </button>
      </div>

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

      <ActivityModal
        open={!!openActivity}
        activity={openActivityObj}
        tours={tours || []}
        hotels={hotels || []}
        onSave={(patch) => updateActivity(openActivity.cityIdx, openActivity.actIdx, patch)}
        onClose={() => setOpenActivity(null)}
      />

      <ConfirmModal
        open={confirmCityIdx !== null}
        title="Remover cidade"
        message="Remover esta cidade e todos os seus itens?"
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => deleteCity(confirmCityIdx)}
        onCancel={() => setConfirmCityIdx(null)}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Remover país"
        message={`Remover "${country.name || 'este país'}" e todas as suas cidades?`}
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

  function duplicate(numDays) {
    const [y, m, d] = selectedDate.split('-').map(Number)
    for (let i = 1; i <= numDays; i++) {
      const next = new Date(y, m - 1, d + i)
      const key  = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
      const existing = data[key] || []
      const clone = {
        ...country,
        id: genId(),
        cities: (country.cities || []).map(c => ({
          ...c,
          id: genId(),
          activities: (c.activities || []).map(a => ({ ...a, id: genId() })),
        })),
      }
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
      <button className="dup-close" onClick={onClose}><i className="ti ti-x" /></button>
      <div className="dup-popover-title">Duplicar para os próximos dias</div>
      <div className="dup-quick-row">
        {[1, 3, 7].map(n => (
          <button key={n} className="dup-quick-btn" onClick={() => duplicate(n)}>+{n} dia{n > 1 ? 's' : ''}</button>
        ))}
      </div>
      <label className="dup-field-label">Ou duplicar até uma data:</label>
      <div className="dup-date-row">
        <input className="dup-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={selectedDate} />
        <button className="btn btn-sm btn-accent" onClick={duplicateToDate}>Duplicar</button>
      </div>
    </div>
  )
}