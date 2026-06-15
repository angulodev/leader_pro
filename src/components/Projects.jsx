import { useEffect, useState } from 'react'
import { getProjects } from '../lib/supabase'
import { StatusTag, Avatar, ProgressBar, Skeleton, EmptyState } from './UI'

export default function Projects({ onSelectProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    getProjects().then(setProjects).finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalBudget = projects.reduce((a, p) => a + (p.budget || 0), 0)
  const avgProgress = projects.length ? (projects.reduce((a, p) => a + p.progress, 0) / projects.length).toFixed(0) : 0

  return (
    <div className="screen-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cartera de Proyectos</h1>
          <p className="page-sub">{projects.length} proyectos · Q2 2026</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost"><span className="mat-icon">download</span><span>Exportar</span></button>
          <button className="btn btn-primary"><span className="mat-icon">add</span><span>Nuevo proyecto</span></button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="summary-strip">
        <div className="summary-cell">
          <div className="summary-val blue">${(totalBudget / 1e6).toFixed(1)}M</div>
          <div className="summary-lbl">Valor total cartera</div>
        </div>
        <div className="summary-cell">
          <div className="summary-val green">{avgProgress}%</div>
          <div className="summary-lbl">Progreso promedio</div>
        </div>
        <div className="summary-cell">
          <div className="summary-val amber">{projects.filter(p => p.status === 'at-risk' || p.status === 'delayed').length}</div>
          <div className="summary-lbl">Proyectos en riesgo</div>
        </div>
        <div className="summary-cell">
          <div className="summary-val purple">{projects.filter(p => p.status === 'on-track').length}</div>
          <div className="summary-lbl">En camino</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <span className="mat-icon search-icon">search</span>
          <input
            className="filter-input"
            placeholder="Buscar proyectos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
          <div style={{ padding: 16 }}><Skeleton h={44} /><Skeleton h={44} style={{marginTop:8}} /><Skeleton h={44} style={{marginTop:8}} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="folder_off" title="Sin proyectos" sub="Intenta ajustar los filtros." />
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
                    <td style={{ minWidth: 140 }}>
                      <ProgressBar actual={p.progress} estimated={p.estimated} />
                    </td>
                    <td>
                      {p.leader ? (
                        <div className="td-leader">
                          <Avatar initials={p.leader.initials} color={p.leader.color} size={26} />
                          <span>{p.leader.name}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`due-date ${p.due_date && new Date(p.due_date) < new Date() ? 'overdue' : ''}`}>
                        {p.due_date ? new Date(p.due_date).toLocaleDateString('es-CL') : '—'}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={e => e.stopPropagation()}>
                        <span className="mat-icon">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
