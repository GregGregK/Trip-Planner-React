// src/components/sidebar/Calendar.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { dateKey, today, MONTHS } from '../../lib/utils'

const DOW = ['D','S','T','Q','Q','S','S']

export default function Calendar() {
  const viewYear      = useTripStore(s => s.viewYear)
  const viewMonth     = useTripStore(s => s.viewMonth)
  const selectedDate  = useTripStore(s => s.selectedDate)
  const setViewYear   = useTripStore(s => s.setViewYear)
  const setViewMonth  = useTripStore(s => s.setViewMonth)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)
  const setCurrentTab = useTripStore(s => s.setCurrentTab)
  const data          = useTripStore(s => s.data)
  const hotels        = useTripStore(s => s.hotels)
  const tours         = useTripStore(s => s.tours)

  const [monthOpen, setMonthOpen] = useState(false)
  const [yearOpen,  setYearOpen]  = useState(false)
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor(viewYear / 4) * 4 - 4
  )

  const todayKey = today()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  function selectDate(d) {
    setSelectedDate(dateKey(viewYear, viewMonth, d))
    setCurrentTab('days')
    setMonthOpen(false)
    setYearOpen(false)
  }

  function hasData(key) {
    const hotelHit = hotels.some(h => h.checkinDay === key || h.checkoutDay === key)
    const tourHit  = tours.some(t => t.linkedDay === key)
    return (data[key]?.length > 0) || hotelHit || tourHit
  }

  // Build calendar days
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const yearRangeEnd = yearRangeStart + 11

  return (
    <div style={{ width: '100%' }}>
      {/* Nav row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
        <button className="cal-btn" onClick={prevMonth} title="Mês anterior">
          <i className="ti ti-chevron-left" />
        </button>

        <div className="cal-selectors">
          {/* Month selector */}
          <div className="cal-selector-wrapper">
            <button className="cal-selector-btn" onClick={() => { setMonthOpen(o => !o); setYearOpen(false) }}>
              {MONTHS[viewMonth]}
              <i className="ti ti-chevron-down" style={{ fontSize: 10, marginLeft: 4 }} />
            </button>
            {monthOpen && (
              <div className="cal-dropdown">
                <div className="cal-dropdown-grid">
                  {MONTHS.map((m, i) => (
                    <button
                      key={i}
                      className={`cal-dropdown-item${i === viewMonth ? ' active' : ''}`}
                      onClick={() => { setViewMonth(i); setMonthOpen(false) }}
                    >
                      {m.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Year selector */}
          <div className="cal-selector-wrapper">
            <button className="cal-selector-btn" onClick={() => { setYearOpen(o => !o); setMonthOpen(false) }}>
              {viewYear}
              <i className="ti ti-chevron-down" style={{ fontSize: 10, marginLeft: 4 }} />
            </button>
            {yearOpen && (
              <div className="cal-dropdown">
                <div className="cal-dropdown-year-nav">
                  <button className="cal-dropdown-year-btn" onClick={() => setYearRangeStart(y => y - 12)}>
                    <i className="ti ti-chevron-left" />
                  </button>
                  <span>{yearRangeStart} - {yearRangeEnd}</span>
                  <button className="cal-dropdown-year-btn" onClick={() => setYearRangeStart(y => y + 12)}>
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>
                <div className="cal-dropdown-grid">
                  {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(y => (
                    <button
                      key={y}
                      className={`cal-dropdown-item${y === viewYear ? ' active' : ''}`}
                      onClick={() => { setViewYear(y); setYearOpen(false) }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="cal-btn" onClick={nextMonth} title="Próximo mês">
          <i className="ti ti-chevron-right" />
        </button>
      </div>

      {/* Grid */}
      <div className="cal-grid" id="calGrid">
        {DOW.map((d, i) => <div key={i} className="cal-dow">{d}</div>)}

        {Array.from({ length: firstDay }, (_, i) => (
          <button key={`e-${i}`} className="cal-day empty" disabled />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const d   = i + 1
          const key = dateKey(viewYear, viewMonth, d)
          return (
            <button
              key={d}
              className={[
                'cal-day',
                key === todayKey    ? 'today'    : '',
                key === selectedDate ? 'selected' : '',
                hasData(key)        ? 'has-data' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => selectDate(d)}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}