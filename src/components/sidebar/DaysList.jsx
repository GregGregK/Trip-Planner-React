// src/components/sidebar/DaysList.jsx
import useTripStore from '../../store/useTripStore.js'
import { fmtDate, fmtFullDate, WEEKDAYS } from '../../lib/utils'
import { useState } from 'react'
import ConfirmModal from '../ui/ConfirmModal'

export default function DaysList() {
  const data          = useTripStore(s => s.data)
  const hotels        = useTripStore(s => s.hotels)
  const tours         = useTripStore(s => s.tours)
  const selectedDate  = useTripStore(s => s.selectedDate)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)
  const setCurrentTab = useTripStore(s => s.setCurrentTab)
  const deleteDayData = useTripStore(s => s.deleteDayData)
  const save          = useTripStore(s => s.save)

  const [confirmKey, setConfirmKey] = useState(null)

  const dayKeys = Object.keys(data).filter(k => data[k]?.length > 0)
  const tourKeys  = tours.filter(t => t.linkedDay).map(t => t.linkedDay)
  const hotelKeys = hotels
    .filter(h => h.checkinDay || h.checkoutDay)
    .flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean))
  const allKeys = [...new Set([...dayKeys, ...tourKeys, ...hotelKeys])].sort()

  if (!allKeys.length) {
    return <div className="day-empty-hint">Nenhum dia planejado ainda.</div>
  }

  function selectDay(key) {
    const [y, m] = key.split('-').map(Number)
    const store = useTripStore.getState()
    store.setViewYear(y)
    store.setViewMonth(m - 1)
    setSelectedDate(key)
    setCurrentTab('days')
  }

  function handleDelete(key) {
    deleteDayData(key)
    save()
    if (selectedDate === key) setSelectedDate(null)
    setConfirmKey(null)
  }

  return (
    <>
      {allKeys.map(key => {
        const [y, m, d] = key.split('-').map(Number)
        void y
        const names = data[key]?.map(c => c.name || 'País').join(', ') || ''
        const isSelected = key === selectedDate

return (
  <div key={key} className="day-pill-wrapper">
    <div
      className={`day-pill${isSelected ? ' active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => selectDay(key)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') selectDay(key) }}
    >
      <span className="day-pill-date">{fmtDate(key)}</span>
      <span className="day-pill-countries">{names || 'Sem países'}</span>
      <button
        className="day-delete-btn-inline"
        title="Remover dia"
        onClick={e => { e.stopPropagation(); setConfirmKey(key) }}
      >
        <i className="ti ti-x" />
      </button>
    </div>
  </div>
)
      })}

      <ConfirmModal
        open={!!confirmKey}
        title="Remover dia"
        message={confirmKey ? `Remover ${fmtFullDate(confirmKey)} e todo seu conteúdo?` : ''}
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => handleDelete(confirmKey)}
        onCancel={() => setConfirmKey(null)}
      />
    </>
  )
}