// src/components/map/MapPanel.jsx
import { useEffect, useRef } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { ENTITY_CONFIG } from '../../lib/utils'

export default function MapPanel({ active }) {
  const data   = useTripStore(s => s.data)
  const tours  = useTripStore(s => s.tours)
  const hotels = useTripStore(s => s.hotels)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)
  const setCurrentTab   = useTripStore(s => s.setCurrentTab)

  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markersRef  = useRef([])

  useEffect(() => {
    if (!active) return

    // Aguardar o container estar visível
    const timer = setTimeout(() => {
      const container = document.getElementById('mapContainer')
      if (!container) return

      // Destruir instância anterior
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }

      const L = window.L
      if (!L) { console.warn('Leaflet não carregado'); return }

      instanceRef.current = L.map('mapContainer', { zoomControl: true }).setView([20, 10], 2)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(instanceRef.current)

      renderPins(L)
    }, 200)

    return () => clearTimeout(timer)
  }, [active, data, tours, hotels])

  function renderPins(L) {
    const map = instanceRef.current
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const pinMap = {}
    const bounds = []

    // Países
    Object.entries(data).forEach(([dateK, countries]) => {
      ;(countries || []).forEach(c => {
        if (!c.lat || !c.lng) return
        const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`
        if (!pinMap[key]) pinMap[key] = { lat: c.lat, lng: c.lng, entries: [], type: 'country' }
        pinMap[key].entries.push({ date: dateK, name: c.name || 'País', flag: c.flag || '🌍', type: 'country' })
      })
    })

    // Passeios
    tours.forEach((t, ti) => {
      if (!t.lat || !t.lng) return
      const key = `${t.lat.toFixed(4)},${t.lng.toFixed(4)}`
      if (!pinMap[key]) pinMap[key] = { lat: t.lat, lng: t.lng, entries: [], type: 'tour' }
      pinMap[key].type = 'tour'
      pinMap[key].entries.push({ date: t.linkedDay || '??', name: t.name || 'Passeio', flag: '🚶‍♂️', type: 'tour', tourIndex: ti })
    })

    // Render pins de países/passeios
    Object.values(pinMap).forEach(pin => {
      const multi  = pin.entries.length > 1
      const isTour = pin.type === 'tour'
      const color  = isTour ? ENTITY_CONFIG.tour.color : (multi ? '#185fa5' : ENTITY_CONFIG.country.color)

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);font-size:14px;line-height:1">${pin.entries[0].flag}</span>
        </div>`,
        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
      })

      const popupRows = pin.entries.map(e => {
        const [y, m, d] = e.date.split('-').map(Number)
        const dateDisplay = isNaN(d) ? e.date : `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`
        if (e.type === 'tour') {
          return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #eee;cursor:pointer" onclick="window.__goToTour(${e.tourIndex})">
            <span style="font-size:15px">${e.flag}</span>
            <div><div style="font-weight:600;font-size:13px">${e.name}</div><div style="font-size:11px;color:#888">${dateDisplay}</div></div>
            <span style="margin-left:auto;font-size:11px;color:${ENTITY_CONFIG.tour.color}">Ver →</span>
          </div>`
        }
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #eee;cursor:pointer" onclick="window.__goToDay('${e.date}')">
          <span style="font-size:15px">${e.flag}</span>
          <div><div style="font-weight:600;font-size:13px">${e.name}</div><div style="font-size:11px;color:#888">${dateDisplay}</div></div>
          <span style="margin-left:auto;font-size:11px;color:${ENTITY_CONFIG.country.color}">Ver →</span>
        </div>`
      }).join('')

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="min-width:180px;font-family:sans-serif">${popupRows}</div>`, { maxWidth: 260 })
      markersRef.current.push(marker)
      bounds.push([pin.lat, pin.lng])
    })

    // Hotéis
    hotels.filter(h => h.lat && h.lng).forEach((h, hi) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${ENTITY_CONFIG.hotel.color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);font-size:13px;line-height:1;color:#fff">${ENTITY_CONFIG.hotel.emoji}</span>
        </div>`,
        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
      })
      const marker = L.marker([h.lat, h.lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="min-width:180px;font-family:sans-serif;cursor:pointer" onclick="window.__goToHotel(${hi})">
          <div style="font-weight:600;font-size:13px">${h.name || 'Hotel'}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">${h.address || ''}</div>
          <div style="font-size:11px;color:${ENTITY_CONFIG.hotel.color};margin-top:4px">Ver hotel →</div>
        </div>`, { maxWidth: 260 })
      markersRef.current.push(marker)
      bounds.push([h.lat, h.lng])
    })

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 })
    setTimeout(() => map.invalidateSize(), 100)
  }

  // Expor handlers para os popups do Leaflet (que usam onclick inline)
  useEffect(() => {
    window.__goToDay = (key) => {
      const [y, m] = key.split('-').map(Number)
      useTripStore.getState().setViewYear(y)
      useTripStore.getState().setViewMonth(m - 1)
      setSelectedDate(key)
      setCurrentTab('days')
    }
    window.__goToTour = () => setCurrentTab('tours')
    window.__goToHotel = () => setCurrentTab('hotels')
    return () => {
      delete window.__goToDay
      delete window.__goToTour
      delete window.__goToHotel
    }
  }, [])

  const totalPins = Object.values(data).flat().filter(c => c.lat).length
    + tours.filter(t => t.lat).length
    + hotels.filter(h => h.lat).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="map-toolbar">
        <div>
          <div className="map-toolbar-title">Mapa da viagem</div>
          <div className="map-toolbar-sub">
            {totalPins > 0
              ? `${totalPins} localização${totalPins > 1 ? 'ões' : ''} no mapa`
              : 'Adicione localizações nos cards de país ou passeios'}
          </div>
        </div>
        <div className="map-legend">
          <div className="map-legend-item"><div className="map-legend-dot" style={{ background: '#2d6a4f' }} /> Destino</div>
          <div className="map-legend-item"><div className="map-legend-dot" style={{ background: '#185fa5' }} /> Vários dias</div>
          <div className="map-legend-item"><div className="map-legend-dot" style={{ background: '#534ab7' }} /> Passeio</div>
          <div className="map-legend-item"><div className="map-legend-dot" style={{ background: '#993556' }} /> Hotel</div>
        </div>
      </div>
      <div id="mapContainer" ref={mapRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  )
}