// src/components/guide/GuidePanel.jsx
import useTripStore from '../../store/useTripStore.js'
import { fmtFullDate, MONTHS, WEEKDAYS, ENTITY_CONFIG, DAY_TYPE_LABELS } from '../../lib/utils'
import { getHotelEventsForDay } from '../../lib/utils'

export default function GuidePanel() {
  const data   = useTripStore(s => s.data)
  const tours  = useTripStore(s => s.tours)
  const hotels = useTripStore(s => s.hotels)

  const dayKeysWithCountries = Object.keys(data).filter(k => data[k]?.length > 0)
  const tourKeys  = tours.filter(t => t.linkedDay).map(t => t.linkedDay)
  const hotelKeys = hotels
    .filter(h => h.checkinDay || h.checkoutDay)
    .flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean))
  const keys = [...new Set([...dayKeysWithCountries, ...tourKeys, ...hotelKeys])].sort()

  if (!keys.length) {
    return (
      <div className="empty-state">
        <i className="ti ti-notes empty-icon" />
        <div className="empty-title">Nada para mostrar ainda</div>
        <div className="empty-sub">Adicione países, passeios ou hotéis para gerar o guia.</div>
      </div>
    )
  }

  const firstKey = keys[0]
  const lastKey  = keys[keys.length - 1]
  const rangeLabel = firstKey === lastKey
    ? fmtFullDate(firstKey)
    : `${fmtFullDate(firstKey)} — ${fmtFullDate(lastKey)}`

  return (
    <div id="guideContent" style={{ flex: 1 }}>
      <div className="guide-header">
        <div>
          <div className="guide-header-title">Guia diário</div>
          <div className="guide-header-sub">Resumo de todos os dias, pronto para imprimir ou levar com você</div>
        </div>
        <button className="btn btn-accent" onClick={() => window.print()}>
          <i className="ti ti-printer" /> Imprimir
        </button>
      </div>

      <div className="guide-doc">
        <div className="guide-trip-title">Roteiro da viagem</div>
        <div className="guide-trip-sub">
          {rangeLabel} · {keys.length} dia{keys.length > 1 ? 's' : ''} planejado{keys.length > 1 ? 's' : ''}
        </div>

        {keys.map(key => {
          const countries   = data[key] || []
          const [y, m, d]   = key.split('-').map(Number)
          const weekday     = WEEKDAYS[new Date(y, m - 1, d).getDay()]
          const hotelEvents = getHotelEventsForDay(key, hotels)
          const dayTours    = tours.filter(t => t.linkedDay === key)

          return (
            <div key={key} className="guide-day">
              <div className="guide-day-title">{weekday}-feira</div>
              <div className="guide-day-date">{d} de {MONTHS[m - 1]} de {y}</div>

              {/* Passeios */}
              {dayTours.length > 0 && (
                <ul className="guide-items" style={{ marginBottom: 10, borderLeft: `3px solid ${ENTITY_CONFIG.tour.color}`, paddingLeft: 12 }}>
                  {dayTours.map((t, i) => (
                    <li key={i} className="guide-item">
                      <span className={`guide-item-time${t.time ? '' : ' empty'}`}>{t.time || '—'}</span>
                      <span>
                        <b>{ENTITY_CONFIG.tour.emoji} {t.name || 'Passeio'}</b>
                        {t.location && ` · ${t.location}`}
                        <span className="guide-item-type">Passeio</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Hotéis */}
              {hotelEvents.length > 0 && (
                <ul className="guide-items" style={{ marginBottom: 10 }}>
                  {hotelEvents.map((ev, i) => {
                    const label = ev.kind === 'checkin' ? 'Check-in' : 'Check-out'
                    return (
                      <li key={i} className="guide-item">
                        <span className={`guide-item-time${ev.time ? '' : ' empty'}`}>{ev.time || '—'}</span>
                        <span>
                          <b>{ENTITY_CONFIG.hotel.emoji} {label}:</b> {ev.hotel.name || 'Hotel'}
                          <span className="guide-item-type">Hospedagem</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Países */}
              {countries.length > 0 && countries.map((c, ci) => {
                const acts = c.activities || []
                return (
                  <div key={ci} className="guide-country">
                    <div className="guide-country-name">
                      {c.flag || '🌍'} {c.name || 'País sem nome'}
                      {c.location && <span className="guide-country-loc">· {c.location}</span>}
                    </div>
                    {acts.length === 0 ? (
                      <div className="guide-empty-day">Sem itens planejados.</div>
                    ) : (
                      <ul className="guide-items">
                        {acts.map((a, ai) => {
                          const typeLabel = a.type === 'custom'
                            ? (a.customType || 'Outro')
                            : (DAY_TYPE_LABELS[a.type] || 'Passeio')
                          return (
                            <li key={ai} className="guide-item">
                              <span className={`guide-item-time${a.time ? '' : ' empty'}`}>{a.time || '—'}</span>
                              <span>
                                {a.name || '(sem descrição)'}
                                <span className="guide-item-type">{typeLabel}</span>
                              </span>
                              {a.description && (
                                <li style={{ fontSize: 12, color: 'var(--muted)', paddingLeft: 52, listStyle: 'none' }}>
                                  {a.description}
                                </li>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}

              {countries.length === 0 && dayTours.length === 0 && hotelEvents.length === 0 && (
                <div className="guide-empty-day">Nenhuma atividade planejada para este dia.</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}