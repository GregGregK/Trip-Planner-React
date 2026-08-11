// src/components/days/ActivityRow.jsx
export default function ActivityRow({ activity, isDimmed, linkedEntity, onOpen, onDelete, onDragStart, onDrop, onDragOver }) {
  return (
    <div
      className={`activity-row${isDimmed ? ' dimmed' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onOpen}
    >
      <div className="drag-handle" onClick={e => e.stopPropagation()} title="Arrastar para reordenar">
        <i className="ti ti-grip-vertical" />
      </div>

      <span className="activity-time">{activity.time || '—'}</span>

      <span className="activity-name">
        {activity.name || '(sem nome)'}
        {linkedEntity && (
          <span className={`activity-link-badge ${linkedEntity.kind}`}>
            <i className={`ti ${
              linkedEntity.kind === 'tour' ? 'ti-map' :
              linkedEntity.kind === 'hotel' ? 'ti-bed' :
              linkedEntity.kind === 'arrival' ? 'ti-plane-arrival' :
              'ti-plane-departure'
            }`} /> {linkedEntity.name}
          </span>
        )}
      </span>

      <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete() }}>
        <i className="ti ti-trash" />
      </button>
    </div>
  )
}