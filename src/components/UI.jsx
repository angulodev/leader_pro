// Shared tiny UI primitives

export function StatusTag({ status }) {
  const map = {
    'on-track':  { label: 'On Track',  cls: 'tag-success' },
    'at-risk':   { label: 'At Risk',   cls: 'tag-warning' },
    'delayed':   { label: 'Delayed',   cls: 'tag-error'   },
    'planning':  { label: 'Planning',  cls: 'tag-info'    },
    'completed': { label: 'Completado',cls: 'tag-muted'   },
  }
  const { label, cls } = map[status] || { label: status, cls: 'tag-muted' }
  return <span className={`tag ${cls}`}>{label}</span>
}

export function Avatar({ initials, color, size = 28 }) {
  return (
    <div
      className="avatar-circle"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

export function ProgressBar({ actual, estimated }) {
  return (
    <div className="progress-wrap">
      <div className="progress-track" style={{ marginBottom: 2 }}>
        <div className="progress-fill actual" style={{ width: `${actual}%` }} />
      </div>
      <div className="progress-track ghost">
        <div className="progress-fill est" style={{ width: `${estimated}%` }} />
      </div>
      <div className="progress-labels">
        <span>Real {actual}%</span>
        <span>Est {estimated}%</span>
      </div>
    </div>
  )
}

export function KPICard({ label, value, sub, colorClass, icon, onClick, hint }) {
  const isClickable = !!onClick
  return (
    <div
      className={`kpi-card ${colorClass} ${isClickable ? 'kpi-card-clickable' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="kpi-card-top">
        <div className="kpi-icon-wrap">
          <span className="mat-icon">{icon}</span>
        </div>
        {isClickable && (
          <span className="kpi-arrow">
            <span className="mat-icon">chevron_right</span>
          </span>
        )}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {hint && <div className="kpi-hint"><span className="mat-icon">touch_app</span>{hint}</div>}
    </div>
  )
}

export function Skeleton({ h = 16, w = '100%', radius = 4 }) {
  return (
    <div
      className="skeleton"
      style={{ height: h, width: w, borderRadius: radius }}
    />
  )
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <span className="mat-icon empty-icon">{icon}</span>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  )
}
