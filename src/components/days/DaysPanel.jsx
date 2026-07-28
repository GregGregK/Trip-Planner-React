// src/components/days/DaysPanel.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { dateKey, fmtDate, fmtFullDate, WEEKDAYS, MONTHS, genId, ENTITY_CONFIG, getHotelEventsForDay, getTourEventsForDay } from '../../lib/utils'
import CountryCard from './CountryCard'
import ConfirmModal from '../ui/ConfirmModal'

const FLAGS = ['🌍','🌎','🌏','🇧🇷','🇵🇹','🇪🇸','🇫🇷','🇮🇹','🇩🇪','🇬🇧','🇯🇵','🇺🇸','🇦🇷','🇨🇱','🇨🇴','🇲🇽','🇨🇳','🇮🇳','🇦🇺','🇨🇦']

export default function DaysPanel() {
  const data            = useTripStore(s => s.data)
  const tours           = useTripStore(s => s.tours)
  const hotels          = useTripStore(s => s.hotels)
  const selectedDate    = useTripStore(s => s.selectedDate)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)
  const setCurrentTab   = useTripStore(s => s.setCurrentTab)
  const setDayData      = useTripStore(s => s.setDayData)
  const deleteDayData   = useTripStore(s => s.deleteDayData)
  const save            = useTripStore(s => s.save)
  const viewYear        = useTripStore(s => s.viewYear)
  const viewMonth       = useTripStore(s => s.viewMonth)

  const [dayTypeFilter, setDayTypeFilter] = useState('all')

  // ── Visão geral (sem dia selecionado) ─────────────────────────────────────
  if (!selectedDate) {
    return <DaysGrid data={data} tours={tours} hotels={hotels} onSelect={(key) => {
      const [y, m, d] = key.split('-').map(Number)
      useTripStore.getState().setViewYear(y)
      useTripStore.getState().setViewMonth(m - 1)
      setSelectedDate(key)
    }} />
  }

  // ── Dia selecionado ───────────────────────────────────────────────────────
  const [y, m, d] = selectedDate.split('-').map(Number)
  const weekday   = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  const countries = data[selectedDate] || []
  const hotelEvents = getHotelEventsForDay(selectedDate, hotels)
  const dayTours    = getTourEventsForDay(selectedDate, tours)

  function addCountry() {
    const next = [...countries, { id: genId(), name: '', flag: '🌍', location: '', lat: null, lng: null, activities: [] }]
    setDayData(selectedDate, next)
    save()
  }

  function updateCountry(ci, patch) {
    const next = countries.map((c, i) => i === ci ? { ...c, ...patch } : c)
    setDayData(selectedDate, next)
    save()
  }

  function deleteCountry(ci) {
    const next = countries.filter((_, i) => i !== ci)
    if (next.length === 0) deleteDayData(selectedDate)
    else setDayData(selectedDate, next)
    save()
  }

  // Filtro de tipos para o dia
  const allActs = countries.flatMap(c => c.activities || [])
  const typeCounts = {}
  allActs.forEach(a => {
    const t = a.type || 'tour'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  })
  const customTypes = {}
  allActs.filter(a => a.type === 'custom').forEach(a => {
    const label = (a.customType || 'Outro').trim() || 'Outro'
    customTypes[label] = (customTypes[label] || 0) + 1
  })

  const TYPE_LABELS = { tour: 'Passeio', bus: 'Ônibus', food: 'Refeição', hotel: 'Hotel' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <div className="main-header">
        <div>
          <div className="main-date">{d} de {MONTHS[m - 1]} de {y}</div>
          <div className="main-weekday">{weekday}-feira</div>
        </div>
        <button className="btn btn-accent" onClick={addCountry}>
          <i className="ti ti-plus" /> Adicionar país
        </button>
      </div>

      {/* Banners de passeios */}
      {dayTours.map((t, i) => (
        <div key={i} className="tour-banner" onClick={() => setCurrentTab('tours')}>
          <i className="ti ti-map tb-icon" />
          <span>Passeio: <b>{t.name || 'Sem nome'}</b>{t.time ? ` às ${t.time}` : ''}</span>
          <span className="tb-arrow">Ver detalhes →</span>
        </div>
      ))}

      {/* Banners de hotéis */}
      {hotelEvents.map((ev, i) => {
        const isCheckin = ev.kind === 'checkin'
        return (
          <div key={i} className="hotel-banner" onClick={() => setCurrentTab('hotels')}>
            <i className={`ti ${isCheckin ? 'ti-login-2' : 'ti-logout-2'} hb-icon`} />
            <span>{isCheckin ? 'Check-in' : 'Check-out'}: <b>{ev.hotel.name || 'Hotel'}</b>{ev.time ? ` às ${ev.time}` : ''}</span>
            <span className="hb-arrow">Ver hotel →</span>
          </div>
        )
      })}

      {/* Filter bar */}
      {allActs.length > 0 && (
        <div className="filter-bar">
          <span className="filter-bar-label">Filtrar:</span>
          <button className={`filter-chip${dayTypeFilter === 'all' ? ' active' : ''}`} onClick={() => setDayTypeFilter('all')}>
            Todos <span className="fc-count">{allActs.length}</span>
          </button>
          {Object.entries(TYPE_LABELS).map(([t, label]) => typeCounts[t] ? (
            <button key={t} className={`filter-chip${dayTypeFilter === t ? ' active' : ''}`} onClick={() => setDayTypeFilter(t)}>
              {label} <span className="fc-count">{typeCounts[t]}</span>
            </button>
          ) : null)}
          {Object.entries(customTypes).map(([label, count]) => (
            <button
              key={label}
              className={`filter-chip${dayTypeFilter === 'custom::' + label ? ' active' : ''}`}
              onClick={() => setDayTypeFilter('custom::' + label)}
            >
              {label} <span className="fc-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {countries.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-map-pin empty-icon" />
          <div className="empty-title">Nenhum país adicionado</div>
          <div className="empty-sub">Clique em "Adicionar país" para começar a planejar este dia.</div>
        </div>
      )}

      {/* Country cards */}
      <div id="mainContent" style={{ flex: 1 }}>
        {countries.map((country, ci) => (
          <CountryCard
            key={country.id || ci}
            country={country}
            ci={ci}
            selectedDate={selectedDate}
            dayTypeFilter={dayTypeFilter}
            flags={FLAGS}
            onUpdate={(patch) => updateCountry(ci, patch)}
            onDelete={() => deleteCountry(ci)}
            onSave={save}
          />
        ))}
      </div>
    </div>
  )
}

// ── Visão geral de dias ────────────────────────────────────────────────────────
function DaysGrid({ data, tours, hotels, onSelect }) {
  const allKeys = [
    ...Object.keys(data).filter(k => data[k]?.length > 0),
    ...tours.filter(t => t.linkedDay).map(t => t.linkedDay),
    ...hotels.filter(h => h.checkinDay || h.checkoutDay)
      .flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean)),
  ]
  const keys = [...new Set(allKeys)].sort()

  // Agrupar por mês
  const byMonth = {}
  keys.forEach(key => {
    const [y, m] = key.split('-')
    const label = `${MONTHS[parseInt(m) - 1]} de ${y}`
    if (!byMonth[label]) byMonth[label] = []
    byMonth[label].push(key)
  })

  if (!keys.length) {
    return (
      <div className="empty-state">
        <i className="ti ti-calendar-event empty-icon" />
        <div className="empty-title">Nenhum dia selecionado</div>
        <div className="empty-sub">Clique em um dia no calendário para planejar os passeios.</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="main-date">Todos os dias</div>
      <div className="main-weekday" style={{ marginBottom: 16 }}>Visão geral da viagem</div>

      <div className="days-grid-container">
        {Object.entries(byMonth).map(([monthLabel, monthKeys]) => (
          <div key={monthLabel} className="days-grid-month">
            <div className="days-grid-month-title">
              <i className="ti ti-calendar" />
              {monthLabel}
              <span className="days-grid-month-count">{monthKeys.length} dia{monthKeys.length > 1 ? 's' : ''}</span>
            </div>

            <div className="days-grid">
              {monthKeys.map(key => {
                const [y, m, d] = key.split('-').map(Number)
                const weekday   = WEEKDAYS[new Date(y, m - 1, d).getDay()]
                const countries = data[key] || []
                const names     = countries.map(c => c.name || 'País').filter(Boolean)
                const flags     = countries.map(c => c.flag || '🌍')
                const actCount  = countries.reduce((sum, c) => sum + (c.activities || []).length, 0)
                const tourCount = tours.filter(t => t.linkedDay === key).length
                const total     = actCount + tourCount

                return (
                  <div key={key} className="day-grid-card" onClick={() => onSelect(key)}>
                    <div className="day-grid-card-header">
                      <div className="day-grid-card-date">
                        <span className="day-grid-card-day">{d}</span>
                        <span className="day-grid-card-weekday">{weekday}</span>
                      </div>
                      {total > 0 && (
                        <span className="day-grid-card-badge">{total} item{total > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="day-grid-card-content">
                      <div className="day-grid-card-row">
                        <span className="day-grid-card-icon">{flags.slice(0, 4).join(' ')}</span>
                        <span className="day-grid-card-text">{names.join(', ') || 'Sem países'}</span>
                      </div>
                    </div>
                    <div className="day-grid-card-footer">
                      <span className="day-grid-card-link">Ver detalhes <i className="ti ti-arrow-right" /></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}