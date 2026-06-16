import { useEffect, useState } from 'react'
import { getProjects, deleteProject } from '../lib/supabase'
import { StatusTag, Avatar, ProgressBar, Skeleton, EmptyState } from './UI'
import ProjectModal from './ProjectModal'

export default function Projects({ onSelectProject }) {
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal]             = useState(null) // null | 'new' | project obj
  const [deleting, setDeleting]       = useState(null)

  const load = () => {
    setLoading(true)
    getProjects().then(setProjects).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return (!q || p.name.toLowerCase().includes(q) || (p.client||'').toLowerCase().includes(q))
      && (!filterStatus || p.status === filterStatus)
  })

  const avgProgress  = projects.length
    ? (projects.reduce((a, p) => a + p.progress, 0) / projects.length).toFixed(0) : 0
  const atRiskCount  = projects.filter(p => ['at-risk','delayed'].includes(p.status)).length
  const onTrackCount = projects.filter(p => p.status === 'on-track').length

  async function handleDelete(p, e) {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar "${p.name}"? Se borrarán todas sus tareas y actividad.`)) return
    setDeleting(p.id)
    try { await deleteProject(p.id); load() }
    catch(err) { alert('Error: ' + err.message) }
    finally { setDeleting(null) }
  }

  return (
    <div className="screen-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cartera de Proyectos</h1>
          <p className="page-sub">{projects.length} proyectos · Q2 2026</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost"><span className="mat-icon">download</span><span>Exportar</span></button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <span className="mat-icon">add</span><span>Nuevo proyecto</span>
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="summary-strip">
        <div className="summary-cell">
          <div className="summary-val blue">{projects.length}</div>
          <div className="summary-lbl">Total proyectos</div>
        </div>
        <div className="summary-cell">
          <div className="summary-val green">{avgProgress}%</div>
          <div className="summary-lbl">Progreso prom.</div>
        </div>
        <div className="summary-cell">
          <div className="summary-val amber">{atRiskCount}</div>
          <div className="summary-lbl">En riesgo</div>
        </div>
        <div className="summary-cell">
          <div className="summary-val purple">{onTrackCount}</div>
          <div className="summary-lbl">On Track</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <span className="mat-icon search-icon">search</span>
          <input className="filter-input" placeholder="Buscar proyectos…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="on-track">On Track</option>
          <option value="at-risk">At Risk</option>
          <option value="delayed">Delayed</option>
          <option value="planning">Planning</option>
          <option value="completed">Completado</option>
        </select>
      </div>

      {/* Table */}
      <div className="card card-flush">
        {loading ? (
          <div style={{padding:16}}><Skeleton h={44}/><Skeleton h={44} style={{marginTop:8}}/><Skeleton h={44} style={{marginTop:8}}/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="folder_off" title="Sin proyectos"
            sub={search || filterStatus ? 'Intenta ajustar los filtros.' : 'Crea tu primer proyecto.'} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Líder</th>
                  <th>Entrega</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="row-hover" onClick={() => onSelectProject(p)}>
                    <td>
                      <div className="td-name">{p.name}</div>
                      <div className="td-sub">{p.client}</div>
                    </td>
                    <td><StatusTag status={p.status} /></td>
                    <td style={{minWidth:140}}><ProgressBar actual={p.progress} estimated={p.estimated} /></td>
                    <td>
                      {p.leader ? (
                        <div className="td-leader">
                          <Avatar initials={p.leader.initials} color={p.leader.color} size={24} />
                          <span>{p.leader.name.split(' ')[0]}</span>
                        </div>
                      ) : <span style={{color:'var(--text-muted)',fontSize:11}}>Sin líder</span>}
                    </td>
                    <td>
                      <span className={`due-date ${p.due_date && new Date(p.due_date) < new Date() && p.status !== 'completed' ? 'overdue' : ''}`}>
                        {p.due_date ? new Date(p.due_date).toLocaleDateString('es-CL') : '—'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{display:'flex',gap:2}}>
                        <button className="icon-btn" title="Editar" onClick={() => setModal(p)}>
                          <span className="mat-icon">edit</span>
                        </button>
                        <button className="icon-btn icon-btn-danger" title="Eliminar"
                          disabled={deleting === p.id}
                          onClick={e => handleDelete(p, e)}>
                          <span className="mat-icon">{deleting === p.id ? 'hourglass_empty' : 'delete_outline'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAB mobile */}
      <button className="fab" onClick={() => setModal('new')} title="Nuevo proyecto">
        <span className="mat-icon">add</span>
      </button>

      {/* Modal */}
      {modal && (
        <ProjectModal
          project={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
