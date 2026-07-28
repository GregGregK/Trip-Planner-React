// src/components/hotels/HotelsPanel.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { getAllDayOptions, geocodeLocation, genId } from '../../lib/utils'
import ConfirmModal from '../ui/ConfirmModal'

export default function HotelsPanel() {
  const hotels      = useTripStore(s => s.hotels)
  const data        = useTripStore(s => s.data)
  const tours       = useTripStore(s => s.tours)
  const addHotel    = useTripStore(s => s.addHotel)
  const updateHotel = useTripStore(s => s.updateHotel)
  const deleteHotel = useTripStore(s => s.deleteHotel)
  const save        = useTripStore(s => s.save)

  const [confirmIdx, setConfirmIdx] = useState(null)
  const [geoStatus, setGeoStatus]   = useState({}) // { idx: 'Buscando…' }

  const dayOptions = getAllDayOptions('', { data, tours, hotels })

  function handleAdd() {
    addHotel({ id: genId(), name: '', address: '', url: '', note: '', checkinDay: '', checkoutDay: '', checkinTime: '', checkoutTime: '', lat: null, lng: null })
    save()
  }

  function handleUpdate(idx, patch) {
    updateHotel(idx, patch)
    save()
  }

  function handleDelete(idx) {
    deleteHotel(idx)
    save()
    setConfirmIdx(null)
  }

  async function handleGeo(idx) {
    const h = hotels[idx]
    const query = h.address || h.name || ''
    if (!query) { setGeoStatus(s => ({ ...s, [idx]: 'Sem endereço' })); return }
    setGeoStatus(s => ({ ...s, [idx]: 'Buscando…' }))
    const result = await geocodeLocation(query)
    if (result.success) {
      handleUpdate(idx, { lat: result.lat, lng: result.lng })
    }
    setGeoStatus(s => ({ ...s, [idx]: result.message }))
    setTimeout(() => setGeoStatus(s => ({ ...s, [idx]: '' })), 2000)
  }

  function hrefFor(url) {
    if (!url) return '#'
    return url.startsWith('http') ? url : 'https://' + url
  }

  if (hotels.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="links-header">
          <div>
            <div className="links-header-title">Hotéis</div>
            <div className="links-header-sub">Endereços, check-in, check-out e links de reserva</div>
          </div>
          <button className="btn btn-accent" onClick={handleAdd}>
            <i className="ti ti-plus" /> Adicionar hotel
          </button>
        </div>
        <div className="empty-state">
          <i className="ti ti-bed empty-icon" />
          <div className="empty-title">Nenhum hotel adicionado</div>
          <div className="empty-sub">Adicione hospedagens para ver check-in e check-out nos dias.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="links-header">
        <div>
          <div className="links-header-title">Hotéis</div>
          <div className="links-header-sub">Endereços, check-in, check-out e links de reserva</div>
        </div>
        <button className="btn btn-accent" onClick={handleAdd}>
          <i className="ti ti-plus" /> Adicionar hotel
        </button>
      </div>

      <div className="hotels-list">
  {hotels.map((h, idx) => (
    <div key={h.id || idx} className="hotel-card">
      <div className="hotel-top-row">
        <div className="hotel-icon"><i className="ti ti-bed" /></div>
        <input
          className="hotel-name-input"
          value={h.name || ''}
          placeholder="Nome do hotel"
          onChange={e => handleUpdate(idx, { name: e.target.value })}
        />
        <div className="hotel-actions">
          <a
            className="link-open-btn"
            href={hrefFor(h.url)}
            target="_blank"
            rel="noopener noreferrer"
            style={!h.url ? { opacity: 0.3, pointerEvents: 'none' } : {}}
          >
            <i className="ti ti-external-link" />
          </a>
          <button className="btn-icon" onClick={() => setConfirmIdx(idx)}>
            <i className="ti ti-trash" />
          </button>
        </div>
      </div>

      <div className="hotel-field-row">
        <i className="ti ti-map-pin" />
        <input
          className="hotel-text-input"
          value={h.address || ''}
          placeholder="Endereço"
          onChange={e => handleUpdate(idx, { address: e.target.value })}
        />
        <button
          className={`geo-btn${h.lat ? ' pinned' : ''}`}
          onClick={() => handleGeo(idx)}
          title="Fixar pin no mapa"
        >
          <i className="ti ti-map-pin-2" /> Fixar pin
        </button>
        {geoStatus[idx] && <span className="geo-status">{geoStatus[idx]}</span>}
      </div>

      <div className="hotel-field-row">
        <i className="ti ti-link" />
        <input
          className="hotel-text-input url"
          value={h.url || ''}
          placeholder="Link da reserva (https://…)"
          onChange={e => handleUpdate(idx, { url: e.target.value })}
        />
      </div>

      <div className="hotel-checkblock">
        <div className="hotel-check-col">
          <div className="hotel-check-label checkin"><i className="ti ti-login-2" /> Check-in</div>
          <div className="hotel-check-fields">
            <select
              className={`hotel-day-select${h.checkinDay ? ' has-day' : ''}`}
              value={h.checkinDay || ''}
              onChange={e => handleUpdate(idx, { checkinDay: e.target.value })}
            >
              {dayOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <input
              type="time"
              className="hotel-time-input"
              value={h.checkinTime || ''}
              onChange={e => handleUpdate(idx, { checkinTime: e.target.value })}
            />
          </div>
        </div>
        <div className="hotel-check-col">
          <div className="hotel-check-label checkout"><i className="ti ti-logout-2" /> Check-out</div>
          <div className="hotel-check-fields">
            <select
              className={`hotel-day-select${h.checkoutDay ? ' has-day' : ''}`}
              value={h.checkoutDay || ''}
              onChange={e => handleUpdate(idx, { checkoutDay: e.target.value })}
            >
              {dayOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <input
              type="time"
              className="hotel-time-input"
              value={h.checkoutTime || ''}
              onChange={e => handleUpdate(idx, { checkoutTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="hotel-footer">
        <textarea
          className="hotel-note-input"
          value={h.note || ''}
          placeholder="Número de reserva, observações…"
          rows={1}
          onChange={e => handleUpdate(idx, { note: e.target.value })}
        />
      </div>
    </div>
  ))}
</div>

      <ConfirmModal
        open={confirmIdx !== null}
        title="Remover hotel"
        message="Tem certeza que deseja remover este hotel?"
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => handleDelete(confirmIdx)}
        onCancel={() => setConfirmIdx(null)}
      />
    </div>
  )
}