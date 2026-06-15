import { useEffect, useState } from 'react'
import { getTasksByProject, getActivity, addComment } from '../lib/supabase'
import { StatusTag, Avatar, Skeleton } from './UI'

const TABS = ['overview', 'tasks', 'team']
const TAB_LABELS = { overview: 'Overview', tasks: 'Tareas', team: 'Equipo' }

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)}d`
}

export default function ProjectDetail({ project, onBack }) {
  const [tab, setTab] = useState('overview')
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!project) return
    setLoading(true)
    Promise.all([
      getTasksByProject(project.id),
      getActivity(8),
    ]).then(([t, a]) => {
      setTasks(t)
      setActivity(a.filter(x => x.project_id === project.id))
    }).finally(() => setLoading(false))
  }, [project])

  if (!project) return null

  const handleComment = async () => {
    if (!comment.trim()) return
    setSending(true)
    try {
      await addComment(project.id, null, comment.trim())
      setActivity(prev => [{
        id: Date.now(), type: 'comment', content: comment.trim(),
        actor: null, project: { name: project.name }, created_at: new Date().toISOString()
      }, ...prev])
      setComment('')
    } finally { setSending(false) }
  }

  const GANTT = [
    { label: '☁️ Cloud Infra', q1: true,  q1end: 0.6, q2: true, q2end: 0.4, q3: false, q4: false, color: '#3b82f6' },
    { label: '🔐 Security',    q1: false, q2: true, q2start: 0.3, q3: true, q3end: 0.5, q4: false, color: '#8b5cf6' },
    { label: '🚀 Migration',   q1: false, q2: false, q3: true, q4: true, q4end: 0.4, color: '#10b981' },
  ]

  return (
    <div className="screen-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <span className="mat-icon">arrow_back</span>
            </button>
            <StatusTag status={project.status} />
          </div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-sub">
            {project.leader && `Liderado por ${project.leader.name} · `}
            {project.budget && `$${(project.budget / 1e6).toFixed(1)}M · `}
            {project.due_date && `Entrega ${new Date(project.due_date).toLocaleDateString('es-CL')}`}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost"><span className="mat-icon">share</span><span>Compartir</span></button>
          <button className="btn btn-primary"><span className="mat-icon">edit</span><span>Editar</span></button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid kpi-grid-4">
        <div className="kpi-card blue">
          <div className="kpi-icon-wrap"><span className="mat-icon">donut_large</span></div>
          <div className="kpi-label">Progreso</div>
          <div className="kpi-value">{project.progress}%</div>
          <div className="kpi-sub">Estimado: {project.estimated}%</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon-wrap"><span className="mat-icon">task_alt</span></div>
          <div className="kpi-label">Tareas</div>
          <div className="kpi-value">{tasks.length}</div>
          <div className="kpi-sub">{tasks.filter(t => t.status === 'completed').length} completadas</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon-wrap"><span className="mat-icon">payments</span></div>
          <div className="kpi-label">Presupuesto</div>
          <div className="kpi-value">${project.budget ? (project.budget / 1e6).toFixed(1) + 'M' : '—'}</div>
          <div className="kpi-sub">Total asignado</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon-wrap"><span className="mat-icon">groups</span></div>
          <div className="kpi-label">Equipo</div>
          <div className="kpi-value">{[...new Set(tasks.map(t => t.assigned_to).filter(Boolean))].length || '—'}</div>
          <div className="kpi-sub">Personas asignadas</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card card-flush">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="tab-body">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="project-layout">
              <div>
                {project.description && (
                  <p className="project-desc">{project.description}</p>
                )}
                {/* Gantt */}
                <div className="card-title" style={{ marginTop: 16 }}>Línea de tiempo · Q1–Q4 2026</div>
                <div className="gantt">
                  <div className="gantt-header">
                    <div />
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <div key={q} className="gantt-q">{q}</div>)}
                  </div>
                  {GANTT.map((row, i) => (
                    <div key={i} className="gantt-row">
                      <div className="gantt-label">{row.label}</div>
                      {[1,2,3,4].map(q => (
                        <div key={q} className="gantt-cell">
                          {row[`q${q}`] && (
                            <div
                              className="gantt-bar"
                              style={{
                                background: row.color,
                                left: `${(row[`q${q}start`] || 0) * 100}%`,
                                right: `${(1 - (row[`q${q}end`] || 1)) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity sidebar */}
              <div>
                <div className="card-title">Actividad</div>
                <div className="activity-list compact">
                  {loading ? <Skeleton h={80} /> : activity.length === 0 ? (
                    <p className="empty-sub">Sin actividad reciente.</p>
                  ) : activity.map(a => (
                    <div key={a.id} className="activity-item">
                      <div className="activity-icon act-comment">
                        <span className="mat-icon">chat_bubble_outline</span>
                      </div>
                      <div className="activity-body">
                        <div className="activity-text">
                          {a.actor && <strong>{a.actor.name}: </strong>}
                          {a.content}
                        </div>
                        <div className="activity-time">{timeAgo(a.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="comment-row">
                  <textarea
                    className="comment-input"
                    rows={2}
                    placeholder="Escribe un comentario…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={sending}>
                    <span className="mat-icon">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TASKS */}
          {tab === 'tasks' && (
            loading ? <Skeleton h={200} /> :
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Tarea</th><th>Asignado</th><th>Estado</th><th>Vence</th></tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} className="row-hover">
                      <td>
                        <div className="td-name">{t.title}</div>
                        <div className="td-sub">{t.group_name}</div>
                      </td>
                      <td>
                        {t.assigned ? (
                          <div className="td-leader">
                            <Avatar initials={t.assigned.initials} color={t.assigned.color} size={24} />
                            <span>{t.assigned.name}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td><StatusTag status={t.status} /></td>
                      <td>
                        <span className={`due-date ${t.due_date && new Date(t.due_date) < new Date() ? 'overdue' : ''}`}>
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('es-CL') : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Sin tareas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TEAM */}
          {tab === 'team' && (
            <div className="team-grid">
              {[...new Map(tasks.filter(t => t.assigned).map(t => [t.assigned_to, t.assigned])).values()].map(m => (
                <div key={m.id || m.name} className="team-card">
                  <Avatar initials={m.initials} color={m.color} size={48} />
                  <div className="team-name">{m.name}</div>
                  <div className="team-role">{m.role}</div>
                </div>
              ))}
              <div className="team-card add-card">
                <div className="add-avatar"><span className="mat-icon">person_add</span></div>
                <div className="team-name muted">Agregar miembro</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
