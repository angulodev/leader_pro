import { useEffect, useState } from 'react'
import { getWorkload, getTeamMembers } from '../lib/supabase'
import { Skeleton } from './UI'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

function heatClass(hours) {
  if (!hours) return 'heat-empty'
  if (hours <= 4) return 'heat-low'
  if (hours <= 7) return 'heat-medium'
  if (hours <= 8) return 'heat-high'
  return 'heat-over'
}

function utilClass(pct) {
  if (pct <= 80) return 'ok'
  if (pct <= 100) return 'warn'
  return 'crit'
}

export default function Workload() {
  const [members, setMembers] = useState([])
  const [workload, setWorkload] = useState([])
  const [loading, setLoading] = useState(true)
  const weekStart = '2026-06-15'

  useEffect(() => {
    Promise.all([getTeamMembers(), getWorkload(weekStart)])
      .then(([m, w]) => { setMembers(m); setWorkload(w) })
      .finally(() => setLoading(false))
  }, [])

  // Build heat map: member → day → { hours, task_label }
  const heatMap = {}
  workload.forEach(w => {
    if (!heatMap[w.member_id]) heatMap[w.member_id] = {}
    const existing = heatMap[w.member_id][w.day_of_week]
    if (existing) {
      existing.hours += w.hours
      existing.label = existing.label + ' / ' + w.task_label
    } else {
      heatMap[w.member_id][w.day_of_week] = { hours: w.hours, label: w.task_label }
    }
  })

  // Utilization per member (total hours vs 40h week)
  const utilization = {}
  members.forEach(m => {
    const total = [1,2,3,4,5].reduce((sum, d) => sum + (heatMap[m.id]?.[d]?.hours || 0), 0)
    utilization[m.id] = Math.round((total / 40) * 100)
  })

  const overloaded = members.filter(m => utilization[m.id] > 100)

  return (
    <div className="screen-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Carga de Trabajo</h1>
          <p className="page-sub">Semana 24 · 15–19 Jun 2026 · {members.length} personas activas</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost"><span className="mat-icon">chevron_left</span></button>
          <span className="week-label">Semana 24</span>
          <button className="btn btn-ghost"><span className="mat-icon">chevron_right</span></button>
          <button className="btn btn-primary"><span className="mat-icon">balance</span><span>Redistribuir</span></button>
        </div>
      </div>

      {/* Alerts */}
      {overloaded.length > 0 && (
        <div className="alerts-row">
          {overloaded.map(m => (
            <div key={m.id} className="alert alert-error">
              <span className="mat-icon">warning</span>
              <span><strong>{m.name}</strong> sobrecargado al {utilization[m.id]}% esta semana</span>
            </div>
          ))}
        </div>
      )}

      {/* Heat map */}
      <div className="card">
        <div className="card-title">Mapa de Calor Semanal</div>
        {loading ? <Skeleton h={200} /> : (
          <div className="heat-grid">
            {/* Header */}
            <div className="heat-row heat-header-row">
              <div className="heat-person-col" />
              {DAYS.map((d, i) => (
                <div key={d} className="heat-day-header">
                  {d} {['15','16','17','18','19'][i]}
                </div>
              ))}
            </div>
            {/* Rows */}
            {members.map(m => (
              <div key={m.id} className="heat-row">
                <div className="heat-person-col">
                  <div className="avatar-circle" style={{ width: 24, height: 24, background: m.color, fontSize: 9, flexShrink: 0 }}>{m.initials}</div>
                  <span className="heat-name">{m.name.split(' ')[0]}</span>
                </div>
                {[1,2,3,4,5].map(d => {
                  const cell = heatMap[m.id]?.[d]
                  return (
                    <div key={d} className={`heat-cell ${heatClass(cell?.hours)}`}>
                      {cell ? <>
                        <span className="heat-hours">{cell.hours}h</span>
                        <span className="heat-task">{cell.label?.split(' ')[0]}</span>
                      </> : <span className="heat-empty-dot">—</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
        <div className="heat-legend">
          <span className="hl hl-low">Bajo (&lt;5h)</span>
          <span className="hl hl-medium">Normal (5–7h)</span>
          <span className="hl hl-high">Alto (8h)</span>
          <span className="hl hl-over">Sobrecarga (&gt;8h)</span>
        </div>
      </div>

      {/* Utilization */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">Utilización por persona</div>
          {loading ? <Skeleton h={120} /> : (
            <div className="util-list">
              {members.map(m => {
                const pct = utilization[m.id] || 0
                const cls = utilClass(pct)
                return (
                  <div key={m.id} className="util-row">
                    <div className="avatar-circle" style={{ width: 22, height: 22, background: m.color, fontSize: 9, flexShrink: 0 }}>{m.initials}</div>
                    <div className="util-name">{m.name.split(' ')[0]}</div>
                    <div className="util-track">
                      <div className={`util-fill util-${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className={`util-pct util-pct-${cls}`}>{pct}%</div>
                    {pct > 100 && <span className="overload-badge">OVL</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Distribución por proyecto</div>
          <p className="empty-sub" style={{ marginTop: 8 }}>Horas totales asignadas esta semana</p>
          {loading ? <Skeleton h={120} /> : (
            <div className="util-list" style={{ marginTop: 12 }}>
              {[...new Map(workload.map(w => [w.project_id, w.project])).values()].filter(Boolean).map((p, i) => {
                const hrs = workload.filter(w => w.project_id === p?.id || w.project_id === Object.keys(heatMap)[0]).reduce((a,b) => a + b.hours, 0)
                const totalHrs = workload.reduce((a,b) => a + b.hours, 0)
                const pct = Math.round((hrs / totalHrs) * 100)
                const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444']
                return (
                  <div key={i} className="util-row">
                    <div className="util-name" style={{ color: 'var(--text-primary)' }}>{workload.find(w => w.project?.name)?.project?.name?.split(' ')[0] || 'Proyecto'}</div>
                    <div className="util-track">
                      <div className="util-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                    <div className="util-pct" style={{ color: 'var(--text-secondary)' }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            <span className="mat-icon">swap_horiz</span> Redistribuir carga
          </button>
        </div>
      </div>
    </div>
  )
}
