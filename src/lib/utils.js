// src/lib/utils.js

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export const LINK_TAG_LIST = ['transport', 'hotel', 'tour', 'info', 'other']
export const LINK_TAG_LABELS = {
  transport: 'Transporte', hotel: 'Hotel', tour: 'Passeio', info: 'Info', other: 'Outro'
}
export const LINK_TAG_ICONS = {
  transport: 'ti-plane', hotel: 'ti-bed', tour: 'ti-map', info: 'ti-info-circle', other: 'ti-link'
}

export const DAY_TYPE_LIST = ['tour', 'bus', 'food', 'hotel', 'custom']
export const DAY_TYPE_LABELS = {
  tour: 'Passeio', bus: 'Ônibus', food: 'Refeição', hotel: 'Hotel', custom: 'Outro'
}

export const ENTITY_CONFIG = {
  tour:    { color: '#534ab7', emoji: '🚶‍♂️', label: 'Passeio', tabId: 'tours' },
  hotel:   { color: '#993556', emoji: '🛏️',  label: 'Hotel',   tabId: 'hotels' },
  country: { color: '#2d6a4f', emoji: '🌍',  label: 'País' },
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
export function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function today() {
  const t = new Date()
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
}

export function fmtDate(key) {
  if (!key) return ''
  const [, m, d] = key.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export function fmtFullDate(key) {
  if (!key) return ''
  const [y, m, d] = key.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]} de ${y}`
}

export function genId() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ─── Geocodificação ───────────────────────────────────────────────────────────
export async function geocodeLocation(query) {
  if (!query) return { success: false, message: 'Sem consulta', lat: null, lng: null }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    )
    const results = await res.json()
    if (results?.length) {
      return { success: true, message: '✓ Pin salvo', lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
    }
    return { success: false, message: 'Não encontrado', lat: null, lng: null }
  } catch {
    return { success: false, message: 'Erro', lat: null, lng: null }
  }
}

// ─── Hotel helpers ────────────────────────────────────────────────────────────
export function getHotelEventsForDay(key, hotels) {
  const events = []
  hotels.forEach((h, hi) => {
    if (h.checkinDay === key)  events.push({ hotel: h, hotelIdx: hi, kind: 'checkin',  time: h.checkinTime })
    if (h.checkoutDay === key) events.push({ hotel: h, hotelIdx: hi, kind: 'checkout', time: h.checkoutTime })
  })
  return events
}

export function getTourEventsForDay(key, tours) {
  return tours.filter(t => t.linkedDay === key)
}

// ─── Day options for selects ──────────────────────────────────────────────────
export function getAllDayOptions(selectedKey, { data, tours, hotels }) {
  const keys = Object.keys(data).filter(k => data[k]?.length > 0).sort()
  const tourKeys = tours.filter(t => t.linkedDay).map(t => t.linkedDay)
  const hotelKeys = hotels
    .filter(h => h.checkinDay || h.checkoutDay)
    .flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean))
  const allKeys = [...new Set([...keys, ...tourKeys, ...hotelKeys])].sort()

  return [
    { value: '', label: '— Sem vínculo —' },
    ...allKeys.map(key => {
      const names = data[key]?.map(c => c.name || 'País').join(', ') || ''
      const tourN = tours.filter(t => t.linkedDay === key).map(t => t.name).join(', ')
      const hotelN = hotels.filter(h => h.checkinDay === key || h.checkoutDay === key).map(h => h.name).join(', ')
      let label = names || tourN || hotelN || 'Dia'
      if (names && tourN) label = `${names} · ${tourN}`
      else if (!names && tourN) label = `🚶‍♂️ ${tourN}`
      else if (!names && !tourN && hotelN) label = `🏨 ${hotelN}`
      return { value: key, label: `${fmtDate(key)} · ${label}` }
    })
  ]
}