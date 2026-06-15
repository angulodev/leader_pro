import { useEffect, useState } from 'react'
import { getDashboardKPIs, getRisks, getActivity, getProjects } from '../lib/supabase'
import { KPICard, StatusTag, Skeleton } from './UI'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)}d`
}

const ACTIVITY_ICONS = {
  comment: { icon: 'chat_bubble_outline', cls: 'act-comment' },
  status:  { icon: 'swap_horiz',          cls: 'act-status'  },
  milestone: { icon: 'flag',              cls: 'act-milestone'},
  assignment: { icon: 'person_add',       cls: 'act-assign'  },
}

export default function Dashboard({ onNavigate }) {
  const [kpi, setKpi] = useState(null)
  const [risks, setRisks] = useState([])
  const [activity, setActivity] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardKPIs(), getRisks(), getActivity(5), getProjects()])
      .then(([k, r, a, p]) => { setKpi(k); setRisks(r); setActivity(a); setProjects(p) })
      .finally(() => setLoading(false))
  }, [])

  const chartData = projects.map(p => ({ label: p.name.split(' ')[0], actual: p.progress, est: p.estimated }))

  return (
    <div className="screen-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard de Liderazgo</h1>
          <p className="page-sub">Vista ejecutiva · {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost"><span className="mat-icon">download</span><span>Exportar</span></button>
          <button className="btn btn-primary" onClick={() => onNavigate('projects')}>
            <span className="mat-icon">add</span><span>Nuevo proyecto</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {loading ? <>
          <Skeleton h={96} /><Skeleton h={96} /><Skeleton h={96} /><Skeleton h={96} />
        </> : <>
          <KPICard label="Total proyectos" value={kpi?.totalProjects} sub="Cartera activa" colorClass="blue" icon="folder_open" />
          <KPICard label="Riesgos activos" value={kpi?.activeRisks} sub="Requieren atención" colorClass="amber" icon="warning_amber" />
          <KPICard label="Capacidad equipo" value={`${kpi?.teamSize ? 84 : '—'}%`} sub={`${kpi?.teamSize} personas activas`} colorClass="green" icon="groups" />
          <KPICard label="Progreso general" value={`${kpi?.avgProgress}%`} sub="+3.2% vs semana pasada" colorClass="purple" icon="trending_up" />
        </>}
      </div>

      {/* Chart + Risks */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">Progreso vs Estimación</div>
          <div className="chart-legend">
            <span className="legend-dot blue" /> Real
            <span className="legend-dot gray" style={{ marginLeft: 12 }} /> Estimado
          </div>
          <div className="bar-chart-wrap">
            {loading ? <Skeleton h={120} /> :
              <div className="bar-chart">
                {chartData.map((d, i) => (
                  <div key={i} className="bar-col">
                    <div className="bar-pair">
                      <div className="bar actual" style={{ height: `${d.actual}%` }} title={`Real: ${d.actual}%`} />
                      <div className="bar est"    style={{ height: `${d.est}%`    }} title={`Est: ${d.est}%`} />
                    </div>
                    <div className="bar-label">{d.label}</div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        <div className="card">
          <div className="card-title">Riesgos Críticos</div>
          {loading ? <><Skeleton h={56} /><Skeleton h={56} style={{marginTop:8}} /></> :
            <div className="risk-list">
              {risks.map(r => (
                <div key={r.id} className={`risk-item ${r.severity}`}>
                  <div className="risk-info">
                    <div className="risk-project">{r.project?.name || '—'}</div>
                    <div className="risk-desc">{r.description}</div>
                  </div>
                  <div className="risk-tags">
                    {r.time_delta   && <span className={`badge badge-${r.severity}`}>{r.time_delta}</span>}
                    {r.budget_delta && <span className={`badge badge-${r.severity}`}>{r.budget_delta}</span>}
                  </div>
                </div>
              ))}
              {risks.length === 0 && <p className="empty-sub">Sin riesgos activos</p>}
            </div>
          }
        </div>
      </div>

      {/* Activity */}
      <div className="card">
        <div className="card-title">Actividad Reciente</div>
        {loading ? <Skeleton h={120} /> :
          <div className="activity-list">
            {activity.map(a => {
              const { icon, cls } = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.comment
              return (
                <div key={a.id} className="activity-item">
                  <div className={`activity-icon ${cls}`}>
                    <span className="mat-icon">{icon}</span>
                  </div>
                  <div className="activity-body">
                    <div className="activity-text">
                      {a.actor && <strong>{a.actor.name} </strong>}
                      {a.content}
                      {a.project && <> · <em>{a.project.name}</em></>}
                    </div>
                    <div className="activity-time">{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        }
      </div>
    </div>
  )
}
