// src/components/links/LinksPanel.jsx
import { useState } from 'react'
import useTripStore from '../../store/useTripStore.js'
import { LINK_TAG_LIST, LINK_TAG_LABELS, LINK_TAG_ICONS, getAllDayOptions, genId } from '../../lib/utils'
import ConfirmModal from '../ui/ConfirmModal'

export default function LinksPanel() {
  const links      = useTripStore(s => s.links)
  const data       = useTripStore(s => s.data)
  const tours      = useTripStore(s => s.tours)
  const hotels     = useTripStore(s => s.hotels)
  const addLink    = useTripStore(s => s.addLink)
  const updateLink = useTripStore(s => s.updateLink)
  const deleteLink = useTripStore(s => s.deleteLink)
  const save       = useTripStore(s => s.save)
  const setSelectedDate = useTripStore(s => s.setSelectedDate)
  const setCurrentTab   = useTripStore(s => s.setCurrentTab)

  const [tagFilter,  setTagFilter]  = useState('all')
  const [confirmIdx, setConfirmIdx] = useState(null)

  const dayOptions = getAllDayOptions('', { data, tours, hotels })

  const visible = links
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => tagFilter === 'all' || (l.tag || 'other') === tagFilter)

  function handleAdd() {
    addLink({ id: genId(), title: '', url: '', note: '', tag: 'other', linkedDay: '' })
    save()
  }

  function handleUpdate(idx, patch) {
    updateLink(idx, patch)
    save()
  }

  function handleDelete(idx) {
    deleteLink(idx)
    save()
    setConfirmIdx(null)
  }

  function goToDay(key) {
    const [y, m, d] = key.split('-').map(Number)
    useTripStore.getState().setViewYear(y)
    useTripStore.getState().setViewMonth(m - 1)
    setSelectedDate(key)
    setCurrentTab('days')
  }

  function hrefFor(url) {
    if (!url) return '#'
    return url.startsWith('http') ? url : 'https://' + url
  }

  // Counts for filter chips
  const counts = {}
  LINK_TAG_LIST.forEach(t => counts[t] = 0)
  links.forEach(l => { const t = l.tag || 'other'; counts[t] = (counts[t] || 0) + 1 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="links-header">
        <div>
          <div className="links-header-title">Links importantes</div>
          <div className="links-header-sub">Passagens, reservas, mapas e qualquer link útil</div>
        </div>
        <button className="btn btn-accent" onClick={handleAdd}>
          <i className="ti ti-plus" /> Adicionar
        </button>
      </div>

      {/* Filter bar */}
      {links.length > 0 && (
        <div className="filter-bar">
          <span className="filter-bar-label">Filtrar:</span>
          <button className={`filter-chip${tagFilter === 'all' ? ' active' : ''}`} onClick={() => setTagFilter('all')}>
            Todos <span className="fc-count">{links.length}</span>
          </button>
          {LINK_TAG_LIST.filter(t => counts[t] > 0).map(t => (
            <button
              key={t}
              className={`filter-chip${tagFilter === t ? ' active' : ''}`}
              onClick={() => setTagFilter(t)}
            >
              <i className={`ti ${LINK_TAG_ICONS[t]}`} style={{ fontSize: 12 }} /> {LINK_TAG_LABELS[t]} <span className="fc-count">{counts[t]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {links.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-link empty-icon" />
          <div className="empty-title">Nenhum link salvo</div>
          <div className="empty-sub">Salve passagens, reservas e qualquer link útil.</div>
        </div>
      )}

      {/* Cards */}
      {visible.length > 0 && (
        <div className="links-grid">
          {visible.map(({ l, i }) => {
            const tag  = l.tag || 'other'
            const href = hrefFor(l.url)
            return (
              <div key={l.id || i} className="link-card">
                <div className="link-icon">
                  <i className={`ti ${LINK_TAG_ICONS[tag] || 'ti-link'}`} />
                </div>
                <div className="link-body">
                  <input
                    className="link-title-input"
                    value={l.title || ''}
                    placeholder="Nome (ex: Passagem Lisboa)"
                    onChange={e => handleUpdate(i, { title: e.target.value })}
                  />
                  <input
                    className="link-url-input"
                    value={l.url || ''}
                    placeholder="https://…"
                    onChange={e => handleUpdate(i, { url: e.target.value })}
                  />
                  <textarea
                    className="link-note-input"
                    value={l.note || ''}
                    placeholder="Anotação…"
                    rows={1}
                    onChange={e => handleUpdate(i, { note: e.target.value })}
                  />
                  <div className="link-tags-row">
                    {LINK_TAG_LIST.map(t => (
                      <button
                        key={t}
                        className={`link-tag${tag === t ? ` ltag-${t}` : ' ltag-other'}`}
                        onClick={() => handleUpdate(i, { tag: t })}
                      >
                        {LINK_TAG_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <i className="ti ti-calendar-event" style={{ fontSize: 13, color: 'var(--muted)' }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Dia:</span>
                    <select
                      className={`link-day-select${l.linkedDay ? ' has-day' : ''}`}
                      value={l.linkedDay || ''}
                      onChange={e => handleUpdate(i, { linkedDay: e.target.value })}
                    >
                      {dayOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {l.linkedDay && (
                      <button
                        style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => goToDay(l.linkedDay)}
                      >
                        Ver dia →
                      </button>
                    )}
                  </div>
                </div>
                <div className="link-actions">
                  <a
                    className="link-open-btn"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={!l.url ? { opacity: 0.3, pointerEvents: 'none' } : {}}
                  >
                    <i className="ti ti-external-link" />
                  </a>
                  <button className="btn-icon" style={{ fontSize: 13 }} onClick={() => setConfirmIdx(i)}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="add-link-btn" onClick={handleAdd}>
        <i className="ti ti-plus" /> Adicionar link
      </button>

      <ConfirmModal
        open={confirmIdx !== null}
        title="Remover link"
        message="Tem certeza que deseja remover este link?"
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => handleDelete(confirmIdx)}
        onCancel={() => setConfirmIdx(null)}
      />
    </div>
  )
}