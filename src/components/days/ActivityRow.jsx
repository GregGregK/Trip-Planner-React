// src/components/days/ActivityRow.jsx
import { useState } from 'react'
import { DAY_TYPE_LIST, DAY_TYPE_LABELS } from '../../lib/utils'
import ConfirmModal from '../ui/ConfirmModal'

export default function ActivityRow({ activity, isDimmed, onUpdate, onDelete, onDragStart, onDrop, onDragOver }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isCustom = activity.type === 'custom'

  return (
    <div
      className={`activity-row${isDimmed ? ' dimmed' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="drag-handle" title="Arrastar para reordenar">
        <i className="ti ti-grip-vertical" />
      </div>

      <input
        type="time"
        className="activity-time"
        value={activity.time || ''}
        onChange={e => onUpdate({ time: e.target.value })}
      />

      <input
        className="activity-name"
        value={activity.name || ''}
        placeholder="Nome da atividade"
        onChange={e => onUpdate({ name: e.target.value })}
      />

      <button className="btn-icon" onClick={() => setConfirmOpen(true)}>
        <i className="ti ti-trash" />
      </button>

      <div className="type-row">
        {DAY_TYPE_LIST.map(type => (
          <button
            key={type}
            className={`type-sel${activity.type === type ? ` active-${type}` : ''}`}
            onClick={() => onUpdate({ type })}
          >
            {DAY_TYPE_LABELS[type]}
          </button>
        ))}
        <input
          className={`custom-type-input${isCustom ? ' visible' : ''}`}
          value={activity.customType || ''}
          placeholder="Tipo"
          onChange={e => onUpdate({ customType: e.target.value })}
        />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Remover atividade"
        message={`Remover "${activity.name || 'esta atividade'}"?`}
        confirmText="Sim, remover"
        isDanger
        onConfirm={() => { setConfirmOpen(false); onDelete() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}