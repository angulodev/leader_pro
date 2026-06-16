import { useEffect, useState } from 'react'
import {
  getTasksByProject, getActivity, addComment,
  createTask, deleteTask,
  getTeamMembers, getProjectMembers, toggleProjectMember
} from '../lib/supabase'
import { StatusTag, Avatar, Skeleton, EmptyState } from './UI'
import ProjectModal from './ProjectModal'

const STATUSES = [
  { value: 'planning',  label: 'Planificación' },
  { value: 'on-track',  label: 'On Track'      },
  { value: 'at-risk',   label: 'At Risk'        },
  { value: 'delayed',   label: 'Delayed'        },
  { value: 'completed', label: 'Completado'     },
]

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)    return 'Hace un momento'
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)}d`
}

const EMPTY_TASK = { title: '', group_name: '', status: 'planning', assigned_to: '', due_date: '' }

export default function ProjectDetail({ project: initialProject, onBack, onProjectUpdated }) {
  const [project, setProject]       = useState(initialProject)
  const [tab, setTab]               = useState('overview')
  const [tasks, setTasks]           = useState([])
  const [activity, setActivity]     = useState([])
  const [members, setMembers]       = useState([])       // all team members
  const [projMembers, setProjMembers] = useState([])     // assigned to this project
  const [loading, setLoading]       = useState(true)
  const [comment, setComment]       = useState('')
  const [sending, setSending]       = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  // Task modal
  const [taskModal, setTaskModal]   = useState(null)     // null | 'new' | task obj
  const [taskForm, setTaskForm]     = useState(EMPTY_TASK)
  const [savingTask, setSavingTask] = useState(false)
  const [deletingTask, setDeletingTask] = useState(null)
  // Team toggle
  const [togglingMember, setTogglingMember] = useState(null)

  const loadAll = () => {
    if (!project) return
    setLoading(true)
    Promise.all([
      getTasksByProject(project.id),
      getActivity(20),
      getTeamMembers(),
      getProjectMembers(project.id),
    ]).then(([t, a, m, pm]) => {
      setTasks(t)
      setActivity(a.filter(x => x.project_id === project.id))
      setMembers(m)
      setProjMembers(pm)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { setProject(initialProject) }, [initialProject])
  useEffect(() => { loadAll() }, [project?.id])

  if (!project) return null

  // ── Comment ──
  const handleComment = async () => {
    if (!comment.trim()) return
    setSending(true)
    try {
      await addComment(project.id, null, comment.trim())
      setActivity(prev => [{
        id: Date.now(), type: 'comment', content: comment.trim(),
        actor_name: null, project_name: project.name, created_at: new Date().toISOString()
      }, ...prev])
      setComment('')
    } finally { setSending(false) }
  }

  // ── Task modal ──
  function openNewTask() {
    setTaskForm(EMPTY_TASK)
    setTaskModal('new')
  }
  function openEditTask(t) {
    setTaskForm({
      title:       t.title,
      group_name:  t.group_name || '',
      status:      t.status,
      assigned_to: t.assigned_to || '',
      due_date:    t.due_date || '',
    })
    setTaskModal(t)
  }
  async function handleSaveTask() {
    if (!taskForm.title.trim()) return
    setSavingTask(true)
    try {
      await createTask({
        ...taskForm,
        id:          taskModal !== 'new' ? taskModal.id : null,
        project_id:  project.id,
        assigned_to: taskForm.assigned_to || null,
        due_date:    taskForm.due_date || null,
      })
      setTaskModal(null)
      loadAll()
    } catch(e) { alert(e.message) }
    finally { setSavingTask(false) }
  }
  async function handleDeleteTask(id, e) {
    e.stopPropagation()
    setDeletingTask(id)
    try { await deleteTask(id); loadAll() }
    catch(e) { alert(e.message) }
    finally { setDeletingTask(null) }
  }

  // ── Team toggle ──
  async function handleToggleMember(memberId) {
    const isAssigned = projMembers.some(pm => pm.member_id === memberId)
    setTogglingMember(memberId)
    try {
      await toggleProjectMember(project.id, memberId, !isAssigned)
      loadAll()
    } catch(e) { alert(e.message) }
    finally { setTogglingMember(null) }
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length

  return (
    <div className="screen-content">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <span className="mat-icon">arrow_back</span>
            </button>
            <StatusTag status={project.status} />
          </div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-sub">
            {project.leader_name && `Líder: ${project.leader_name} · `}
            {project.due_date && `Entrega ${new Date(project.due_date).toLocaleDateString('es-CL')}`}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowEditProject(true)}>
            <span className="mat-icon">edit</span>
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-card-top"><div className="kpi-icon-wrap"><span className="mat-icon">donut_large</span></div></div>
          <div className="kpi-label">Progreso</div>
          <div className="kpi-value">{project.progress}%</div>
          <div className="kpi-sub">Estimado: {project.estimated}%</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-card-top"><div className="kpi-icon-wrap"><span className="mat-icon">task_alt</span></div></div>
          <div className="kpi-label">Tareas</div>
          <div className="kpi-value">{tasks.length}</div>
          <div className="kpi-sub">{completedTasks} completadas</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-card-top"><div className="kpi-icon-wrap"><span className="mat-icon">schedule</span></div></div>
          <div className="kpi-label">Entrega</div>
          <div className="kpi-value" style={{fontSize:15}}>
            {project.due_date ? new Date(project.due_date).toLocaleDateString('es-CL') : '—'}
          </div>
          <div className="kpi-sub">{project.status === 'completed' ? 'Finalizado' : 'Fecha límite'}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-card-top"><div className="kpi-icon-wrap"><span className="mat-icon">groups</span></div></div>
          <div className="kpi-label">Equipo</div>
          <div className="kpi-value">{projMembers.length || '—'}</div>
          <div className="kpi-sub">Personas asignadas</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="card card-flush">
        <div className="tabs">
          {['overview','tasks','team'].map(t => (
            <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
              {t==='overview'?'Overview':t==='tasks'?`Tareas (${tasks.length})`:'Equipo'}
            </button>
          ))}
        </div>

        <div className="tab-body">

          {/* ════ OVERVIEW ════ */}
          {tab === 'overview' && (
            <div className="overview-layout">
              {/* Left: desc + progress */}
              <div className="overview-main">
                {project.description
                  ? <p className="project-desc">{project.description}</p>
                  : <p className="project-desc" style={{color:'var(--text-muted)',fontStyle:'italic'}}>
                      Sin descripción. <button className="link-btn" onClick={() => setShowEditProject(true)}>Agregar descripción →</button>
                    </p>
                }

                {/* Progress visual */}
                <div className="overview-progress-block">
                  <div className="overview-progress-row">
                    <span className="overview-progress-label">Progreso real</span>
                    <span className="overview-progress-val" style={{color:'var(--accent)'}}>{project.progress}%</span>
                  </div>
                  <div className="progress-track" style={{height:8}}>
                    <div className="progress-fill actual" style={{width:`${project.progress}%`, height:'100%'}}/>
                  </div>
                  <div className="overview-progress-row" style={{marginTop:8}}>
                    <span className="overview-progress-label">Estimado</span>
                    <span className="overview-progress-val" style={{color:'var(--text-muted)'}}>{project.estimated}%</span>
                  </div>
                  <div className="progress-track" style={{height:6,opacity:.5}}>
                    <div className="progress-fill est" style={{width:`${project.estimated}%`, height:'100%'}}/>
                  </div>
                </div>

                {/* Quick task summary */}
                {tasks.length > 0 && (
                  <div className="overview-tasks-mini">
                    <div className="card-title" style={{marginBottom:8}}>Tareas recientes</div>
                    {tasks.slice(0,3).map(t => (
                      <div key={t.id} className="mini-task">
                        <span className={`mini-task-dot ${t.status}`}/>
                        <span className="mini-task-name">{t.title}</span>
                        <StatusTag status={t.status}/>
                      </div>
                    ))}
                    {tasks.length > 3 && (
                      <button className="link-btn" style={{marginTop:6}} onClick={()=>setTab('tasks')}>
                        Ver todas las tareas ({tasks.length}) →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: activity */}
              <div className="overview-side">
                <div className="card-title">Actividad</div>
                <div className="activity-list compact">
                  {loading ? <Skeleton h={60}/> : activity.length === 0
                    ? <p className="empty-sub">Sin actividad aún.</p>
                    : activity.map(a => (
                      <div key={a.id} className="activity-item">
                        <div className="activity-icon act-comment">
                          <span className="mat-icon">chat_bubble_outline</span>
                        </div>
                        <div className="activity-body">
                          <div className="activity-text">
                            {a.actor_name && <strong>{a.actor_name}: </strong>}
                            {a.content}
                          </div>
                          <div className="activity-time">{timeAgo(a.created_at)}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <div className="comment-row">
                  <textarea className="comment-input" rows={2}
                    placeholder="Escribe un comentario… (Ctrl+Enter)"
                    value={comment} onChange={e=>setComment(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)handleComment()}}/>
                  <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={sending}>
                    <span className="mat-icon">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ TASKS ════ */}
          {tab === 'tasks' && (
            <div>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
                <button className="btn btn-primary" onClick={openNewTask}>
                  <span className="mat-icon">add</span> Nueva tarea
                </button>
              </div>
              {loading ? <Skeleton h={150}/> : tasks.length === 0
                ? <EmptyState icon="task_alt" title="Sin tareas" sub="Crea la primera tarea de este proyecto."/>
                : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Tarea</th><th>Asignado</th><th>Estado</th><th>Vence</th><th></th></tr>
                      </thead>
                      <tbody>
                        {tasks.map(t => (
                          <tr key={t.id} className="row-hover" onClick={()=>openEditTask(t)}>
                            <td>
                              <div className="td-name">{t.title}</div>
                              {t.group_name && <div className="td-sub">{t.group_name}</div>}
                            </td>
                            <td>
                              {t.assigned
                                ? <div className="td-leader">
                                    <Avatar initials={t.assigned.initials} color={t.assigned.color} size={24}/>
                                    <span>{t.assigned.name.split(' ')[0]}</span>
                                  </div>
                                : <span style={{color:'var(--text-muted)',fontSize:11}}>Sin asignar</span>
                              }
                            </td>
                            <td><StatusTag status={t.status}/></td>
                            <td>
                              <span className={`due-date ${t.due_date&&new Date(t.due_date)<new Date()&&t.status!=='completed'?'overdue':''}`}>
                                {t.due_date?new Date(t.due_date).toLocaleDateString('es-CL'):'—'}
                              </span>
                            </td>
                            <td onClick={e=>e.stopPropagation()}>
                              <button className="icon-btn icon-btn-danger"
                                disabled={deletingTask===t.id}
                                onClick={e=>handleDeleteTask(t.id,e)}>
                                <span className="mat-icon">{deletingTask===t.id?'hourglass_empty':'delete_outline'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}

          {/* ════ TEAM ════ */}
          {tab === 'team' && (
            <div>
              <p style={{fontSize:12,color:'var(--text-secondary)',marginBottom:14}}>
                Toca una persona para asignarla o quitarla del proyecto.
              </p>
              {loading ? <Skeleton h={120}/> : members.length === 0
                ? <EmptyState icon="group_off" title="Sin miembros de equipo" sub="Agrega personas en la sección Equipo primero."/>
                : (
                  <div className="team-assign-grid">
                    {members.map(m => {
                      const assigned = projMembers.some(pm => pm.member_id === m.id)
                      const busy = togglingMember === m.id
                      return (
                        <button key={m.id}
                          className={`team-assign-card ${assigned?'assigned':''}`}
                          onClick={()=>handleToggleMember(m.id)}
                          disabled={busy}
                        >
                          <div style={{position:'relative'}}>
                            <Avatar initials={m.initials} color={assigned?m.color:'#94a3b8'} size={44}/>
                            {assigned && (
                              <div className="assigned-check">
                                <span className="mat-icon">check</span>
                              </div>
                            )}
                            {busy && (
                              <div className="assigned-check" style={{background:'var(--secondary)'}}>
                                <span className="mat-icon spin" style={{fontSize:12}}>refresh</span>
                              </div>
                            )}
                          </div>
                          <div className="team-assign-name">{m.name.split(' ')[0]}</div>
                          <div className="team-assign-role">{m.role.split(' ')[0]}</div>
                          <div className={`team-assign-badge ${assigned?'badge-assigned':'badge-unassigned'}`}>
                            {assigned?'Asignado':'+ Asignar'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              }
            </div>
          )}

        </div>
      </div>

      {/* ── Edit project modal ── */}
      {showEditProject && (
        <ProjectModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onSaved={(updated) => {
            setShowEditProject(false)
            // Reload project data
            if (onProjectUpdated) onProjectUpdated()
          }}
        />
      )}

      {/* ── Task modal ── */}
      {taskModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setTaskModal(null)}}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{taskModal==='new'?'Nueva tarea':'Editar tarea'}</h2>
              <button className="icon-btn" onClick={()=>setTaskModal(null)}>
                <span className="mat-icon">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-input" autoFocus value={taskForm.title}
                  onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}
                  placeholder="ej. Configurar base de datos"/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Grupo / Fase</label>
                  <input className="form-input" value={taskForm.group_name}
                    onChange={e=>setTaskForm(f=>({...f,group_name:e.target.value}))}
                    placeholder="ej. Backend"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-input" value={taskForm.status}
                    onChange={e=>setTaskForm(f=>({...f,status:e.target.value}))}>
                    {STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Asignar a</label>
                  <select className="form-input" value={taskForm.assigned_to}
                    onChange={e=>setTaskForm(f=>({...f,assigned_to:e.target.value}))}>
                    <option value="">Sin asignar</option>
                    {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input className="form-input" type="date" value={taskForm.due_date}
                    onChange={e=>setTaskForm(f=>({...f,due_date:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setTaskModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveTask} disabled={savingTask||!taskForm.title.trim()}>
                {savingTask
                  ? <><span className="mat-icon spin">refresh</span> Guardando…</>
                  : <><span className="mat-icon">check</span> {taskModal==='new'?'Crear tarea':'Guardar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
