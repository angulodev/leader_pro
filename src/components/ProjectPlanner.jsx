const TASK_STATUS_COLOR = {
  todo:          '#94a3b8',
  'in-progress': '#3b82f6',
  review:        '#f59e0b',
  blocked:       '#ef4444',
  completed:     '#10b981',
}

function parseDate(d) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  return isNaN(dt) ? null : dt
}

function formatShort(d) {
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// Genera marcas de grilla mensuales entre rangeStart y rangeEnd.
function monthTicks(rangeStart, rangeEnd) {
  const ticks = []
  let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cur <= rangeEnd) {
    ticks.push(new Date(cur))
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return ticks
}

export default function ProjectPlanner({ project, tasks }) {
  const tasksWithDates = tasks.filter(t => t.start_date || t.due_date)

  if (!project.start_date && !project.due_date && tasksWithDates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
        <span className="mat-icon" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>timeline</span>
        Sin fechas registradas todavía.
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Agrega una fecha de inicio al proyecto (editar proyecto) y fechas a las tareas para ver la línea de tiempo.
        </div>
      </div>
    )
  }

  // Rango total: lo más temprano entre inicio de proyecto y de tareas,
  // hasta lo más tardío entre entrega de proyecto y de tareas.
  const allStarts = [project.start_date, ...tasksWithDates.map(t => t.start_date || t.due_date)]
    .map(parseDate).filter(Boolean)
  const allEnds = [project.due_date, ...tasksWithDates.map(t => t.due_date || t.start_date)]
    .map(parseDate).filter(Boolean)

  if (allStarts.length === 0 || allEnds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
        <span className="mat-icon" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>timeline</span>
        Sin fechas suficientes para construir la línea de tiempo.
      </div>
    )
  }

  let rangeStart = new Date(Math.min(...allStarts))
  let rangeEnd   = new Date(Math.max(...allEnds))
  if (rangeEnd <= rangeStart) rangeEnd = addDays(rangeStart, 7)
  // Margen visual de unos días a cada lado
  rangeStart = addDays(rangeStart, -2)
  rangeEnd   = addDays(rangeEnd, 2)
  const totalMs = rangeEnd - rangeStart

  const pct = d => Math.max(0, Math.min(100, ((d - rangeStart) / totalMs) * 100))

  // Agrupar tareas por fase (group_name)
  const groups = {}
  for (const t of tasksWithDates) {
    const key = t.group_name?.trim() || 'Sin fase'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  const groupNames = Object.keys(groups)

  const today = new Date(new Date().toDateString())
  const todayPct = today >= rangeStart && today <= rangeEnd ? pct(today) : null
  const ticks = monthTicks(rangeStart, rangeEnd)

  return (
    <div className="planner-wrap">
      {/* Línea de tiempo del proyecto */}
      <div className="planner-project-row">
        <div className="planner-row-label">
          <span className="mat-icon" style={{ fontSize: 16 }}>flag</span>
          Proyecto
        </div>
        <div className="planner-track">
          {project.start_date && project.due_date && (
            <div
              className="planner-bar planner-bar-project"
              style={{
                left: `${pct(parseDate(project.start_date))}%`,
                width: `${Math.max(pct(parseDate(project.due_date)) - pct(parseDate(project.start_date)), 1)}%`,
              }}
              title={`${formatShort(parseDate(project.start_date))} → ${formatShort(parseDate(project.due_date))}`}
            />
          )}
        </div>
      </div>

      <div className="planner-divider" />

      {/* Grilla de meses */}
      <div className="planner-grid-row">
        <div className="planner-row-label" />
        <div className="planner-track planner-track-grid">
          {ticks.map((m, i) => (
            <div key={i} className="planner-tick" style={{ left: `${pct(m)}%` }}>
              <span>{m.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })}</span>
            </div>
          ))}
          {todayPct !== null && (
            <div className="planner-today" style={{ left: `${todayPct}%` }} title="Hoy" />
          )}
        </div>
      </div>

      {/* Fases con sus tareas */}
      {groupNames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
          Ninguna tarea tiene fecha de inicio o límite todavía.
        </div>
      ) : groupNames.map(group => (
        <div key={group} className="planner-phase">
          <div className="planner-phase-label">{group}</div>
          {groups[group].map(t => {
            const start = parseDate(t.start_date || t.due_date)
            const end   = parseDate(t.due_date || t.start_date)
            const left  = pct(start)
            const width = Math.max(pct(end) - left, 1.2)
            return (
              <div key={t.id} className="planner-row">
                <div className="planner-row-label" title={t.title}>{t.title}</div>
                <div className="planner-track">
                  <div
                    className="planner-bar"
                    style={{ left: `${left}%`, width: `${width}%`, background: TASK_STATUS_COLOR[t.status] || 'var(--accent)' }}
                    title={`${t.title} · ${formatShort(start)} → ${formatShort(end)}`}
                  />
                  {todayPct !== null && <div className="planner-today planner-today-thin" style={{ left: `${todayPct}%` }} />}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
