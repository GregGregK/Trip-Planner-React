// src/components/ui/SaveStatus.jsx
import useTripStore from '../../store/useTripStore.js'

const STATUS_MAP = {
  saving: { icon: 'ti-cloud-upload', label: 'Salvando...',      color: 'var(--muted)'   },
  saved:  { icon: 'ti-cloud-check',  label: 'Salvo na nuvem',   color: 'var(--accent)'  },
  error:  { icon: 'ti-cloud-x',      label: 'Erro ao salvar',   color: 'var(--danger)'  },
  idle:   { icon: 'ti-cloud',        label: 'Dados na nuvem',   color: 'var(--muted)'   },
}

export default function SaveStatus() {
  const saveStatus = useTripStore(s => s.saveStatus)
  const { icon, label, color } = STATUS_MAP[saveStatus] ?? STATUS_MAP.idle

  return (
    <div
      id="saveStatus"
      style={{
        fontSize: 10,
        padding: '2px 16px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color,
        transition: 'color .3s',
        flexShrink: 0,
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 10 }} />
      {label}
    </div>
  )
}