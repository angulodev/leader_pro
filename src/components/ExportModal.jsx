import { useEffect, useState } from 'react'
import { getProjects, getTasksByProject, getRisksByProject, getProjectMembers } from '../lib/supabase'
import { Avatar, Skeleton } from './UI'

// ── Status labels & colors ────────────────────────
const STATUS_CFG = {
  backlog:   { label: 'Backlog',       color: '#94a3b8', dot: '⚪' },
  planning:  { label: 'Planificación', color: '#3b82f6', dot: '🔵' },
  active:    { label: 'En desarrollo', color: '#10b981', dot: '🟢' },
  'at-risk': { label: 'En riesgo',     color: '#f59e0b', dot: '🟡' },
  'on-hold': { label: 'En pausa',      color: '#8b5cf6', dot: '🟣' },
  completed: { label: 'Completado',    color: '#06b6d4', dot: '✅' },
}
const SEV_CFG = {
  high:   { label: 'Alto',  color: '#ef4444', bg: '#fee2e2' },
  medium: { label: 'Medio', color: '#f59e0b', bg: '#fef3c7' },
  low:    { label: 'Bajo',  color: '#10b981', bg: '#d1fae5' },
}
const TASK_STATUS = {
  todo:          { label: 'Pendiente',    color: '#94a3b8' },
  'in-progress': { label: 'En curso',     color: '#3b82f6' },
  review:        { label: 'En revisión',  color: '#f59e0b' },
  blocked:       { label: 'Bloqueado',    color: '#ef4444' },
  completed:     { label: 'Completado',   color: '#10b981' },
}

// ── HTML report generator ─────────────────────────
function buildReportHTML({ projects, detailData, reportType, generatedAt }) {
  const fmt = iso => iso ? new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const fmtShort = iso => iso ? new Date(iso).toLocaleDateString('es-CL') : '—'

  const globalSection = `
    <div class="section">
      <h2>Resumen Ejecutivo</h2>
      <p class="meta">Generado el ${fmt(generatedAt)} · ${projects.length} proyecto${projects.length !== 1 ? 's' : ''} seleccionado${projects.length !== 1 ? 's' : ''}</p>

      <table class="summary-table">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Semáforo</th>
            <th>Estado</th>
            <th>Fase / Cliente</th>
            <th>Progreso</th>
            <th>Estimado</th>
            <th>Entrega</th>
            <th>Líder</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => {
            const sc = STATUS_CFG[p.status] || STATUS_CFG.planning
            const dev = p.progress - p.estimated
            const overdue = p.due_date && new Date(p.due_date) < new Date() && p.status !== 'completed'
            return `
              <tr>
                <td><strong>${p.name}</strong>${p.client ? `<br/><span class="sub">${p.client}</span>` : ''}</td>
                <td class="center">
                  <span class="semaforo" style="background:${sc.color}">${sc.dot}</span>
                </td>
                <td><span class="badge" style="background:${sc.color}20;color:${sc.color};border:1px solid ${sc.color}40">${sc.label}</span></td>
                <td class="sub">${p.client || '—'}</td>
                <td>
                  <div class="progress-cell">
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" style="width:${p.progress}%;background:${sc.color}"></div>
                    </div>
                    <span>${p.progress}%</span>
                  </div>
                </td>
                <td class="center sub">${p.estimated}%</td>
                <td class="${overdue ? 'overdue' : ''}">${fmtShort(p.due_date)}</td>
                <td>${p.leader_name || '—'}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-val">${projects.length}</div>
          <div class="kpi-lbl">Total proyectos</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-val" style="color:#10b981">${projects.filter(p => p.status === 'active').length}</div>
          <div class="kpi-lbl">En desarrollo</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-val" style="color:#f59e0b">${projects.filter(p => p.status === 'at-risk').length}</div>
          <div class="kpi-lbl">En riesgo</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-val" style="color:#06b6d4">${projects.filter(p => p.status === 'completed').length}</div>
          <div class="kpi-lbl">Completados</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-val">${projects.length > 0 ? Math.round(projects.reduce((a,p)=>a+p.progress,0)/projects.length) : 0}%</div>
          <div class="kpi-lbl">Progreso promedio</div>
        </div>
      </div>
    </div>
  `

  const detailSections = reportType !== 'summary' ? projects.map(p => {
    const dd = detailData[p.id] || {}
    const tasks = dd.tasks || []
    const risks = dd.risks || []
    const members = dd.members || []
    const sc = STATUS_CFG[p.status] || STATUS_CFG.planning
    const completedTasks = tasks.filter(t => t.status === 'completed').length

    return `
      <div class="section page-break">
        <div class="project-header" style="border-left:4px solid ${sc.color}">
          <div class="project-header-top">
            <div>
              <h2>${p.name}</h2>
              ${p.client ? `<p class="sub">${p.client}</p>` : ''}
            </div>
            <span class="badge lg" style="background:${sc.color}20;color:${sc.color};border:1px solid ${sc.color}60">
              ${sc.dot} ${sc.label}
            </span>
          </div>
          <div class="project-meta-row">
            <span><strong>Líder:</strong> ${p.leader_name || '—'}</span>
            <span><strong>Entrega:</strong> ${fmt(p.due_date)}</span>
            <span><strong>Progreso:</strong> ${p.progress}% (est. ${p.estimated}%)</span>
          </div>
          ${p.description ? `<p class="description">${p.description}</p>` : ''}
        </div>

        <!-- Progress visual -->
        <div class="progress-section">
          <div class="progress-label-row">
            <span>Progreso real</span><strong>${p.progress}%</strong>
          </div>
          <div class="progress-bar-wrap big">
            <div class="progress-bar-fill" style="width:${p.progress}%;background:${sc.color}"></div>
          </div>
          <div class="progress-label-row" style="opacity:.6;margin-top:4px">
            <span>Estimado</span><span>${p.estimated}%</span>
          </div>
          <div class="progress-bar-wrap big" style="opacity:.4">
            <div class="progress-bar-fill" style="width:${p.estimated}%;background:#94a3b8"></div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-row small">
          <div class="kpi-box">
            <div class="kpi-val">${tasks.length}</div>
            <div class="kpi-lbl">Tareas</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val" style="color:#10b981">${completedTasks}</div>
            <div class="kpi-lbl">Completadas</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val" style="color:#ef4444">${tasks.filter(t=>t.status==='blocked').length}</div>
            <div class="kpi-lbl">Bloqueadas</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val" style="color:#f59e0b">${risks.filter(r=>r.severity==='high').length}</div>
            <div class="kpi-lbl">Riesgos altos</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val">${members.length}</div>
            <div class="kpi-lbl">Equipo</div>
          </div>
        </div>

        <!-- Team -->
        ${members.length > 0 ? `
          <h3>Equipo asignado</h3>
          <div class="team-pills">
            ${members.map(m => `
              <span class="team-pill">
                <span class="avatar-dot" style="background:${m.color}">${m.initials}</span>
                ${m.name} <span class="sub">${m.role}</span>
              </span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Tasks -->
        ${tasks.length > 0 ? `
          <h3>Tareas (${tasks.length})</h3>
          <table class="detail-table">
            <thead>
              <tr><th>Tarea</th><th>Grupo</th><th>Asignado</th><th>Estado</th><th>Vence</th></tr>
            </thead>
            <tbody>
              ${tasks.map(t => {
                const tc = TASK_STATUS[t.status] || TASK_STATUS.todo
                const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
                return `
                  <tr>
                    <td>${t.title}</td>
                    <td class="sub">${t.group_name || '—'}</td>
                    <td>${t.assigned_name || '—'}</td>
                    <td><span class="badge sm" style="background:${tc.color}20;color:${tc.color}">${tc.label}</span></td>
                    <td class="${overdue ? 'overdue' : 'sub'}">${fmtShort(t.due_date)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        ` : '<p class="empty-note">Sin tareas registradas.</p>'}

        <!-- Risks -->
        ${risks.length > 0 ? `
          <h3>Riesgos (${risks.length})</h3>
          <table class="detail-table">
            <thead>
              <tr><th>Riesgo</th><th>Severidad</th><th>Impacto tiempo</th><th>Impacto costo</th><th>Registrado</th></tr>
            </thead>
            <tbody>
              ${risks.map(r => {
                const rc = SEV_CFG[r.severity] || SEV_CFG.medium
                return `
                  <tr>
                    <td>
                      <strong>${r.title}</strong>
                      ${r.description ? `<br/><span class="sub">${r.description}</span>` : ''}
                    </td>
                    <td><span class="badge sm" style="background:${rc.bg};color:${rc.color}">${rc.label}</span></td>
                    <td class="center">${r.time_delta || '—'}</td>
                    <td class="center">${r.budget_delta || '—'}</td>
                    <td class="sub">${fmtShort(r.created_at)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        ` : '<p class="empty-note">Sin riesgos registrados.</p>'}
      </div>
    `
  }).join('') : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte Area Leader Pro · ${fmt(generatedAt)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px; color: #1e293b; line-height: 1.5;
    padding: 20px;
  }
  h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 20px 0 10px; }
  h3 { font-size: 13px; font-weight: 600; color: #475569; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: .5px; }
  .meta { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  .sub  { color: #64748b; font-size: 10px; }
  .center { text-align: center; }
  .overdue { color: #ef4444; font-weight: 600; }
  .empty-note { color: #94a3b8; font-style: italic; font-size: 11px; padding: 8px 0; }

  /* Report header */
  .report-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 16px; margin-bottom: 4px;
    border-bottom: 3px solid #1e293b;
  }
  .report-logo { font-size: 18px; font-weight: 800; color: #1e293b; }
  .report-logo span { color: #3b82f6; }
  .report-date { font-size: 10px; color: #64748b; text-align: right; }

  /* Section */
  .section { margin-bottom: 24px; }
  .page-break { page-break-before: always; }

  /* Summary table */
  .summary-table, .detail-table {
    width: 100%; border-collapse: collapse; margin-bottom: 16px;
  }
  .summary-table th, .detail-table th {
    background: #1e293b; color: white;
    padding: 7px 8px; text-align: left; font-size: 10px;
    font-weight: 600; text-transform: uppercase; letter-spacing: .4px;
  }
  .summary-table td, .detail-table td {
    padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;
  }
  .summary-table tr:nth-child(even) td,
  .detail-table  tr:nth-child(even) td { background: #f8fafc; }

  /* KPIs */
  .kpi-row {
    display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap;
  }
  .kpi-row.small .kpi-box { padding: 8px 12px; }
  .kpi-box {
    flex: 1; min-width: 80px;
    border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 12px 14px; text-align: center; background: #f8fafc;
  }
  .kpi-val { font-size: 22px; font-weight: 800; letter-spacing: -1px; color: #1e293b; }
  .kpi-row.small .kpi-val { font-size: 16px; }
  .kpi-lbl { font-size: 9px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: .4px; }

  /* Badge */
  .badge {
    display: inline-block; padding: 2px 7px; border-radius: 99px;
    font-size: 10px; font-weight: 600; white-space: nowrap;
  }
  .badge.lg { padding: 4px 10px; font-size: 11px; }
  .badge.sm { padding: 1px 5px; font-size: 9px; }

  /* Semáforo */
  .semaforo {
    display: inline-block; width: 18px; height: 18px; border-radius: 50%;
    font-size: 12px; text-align: center; line-height: 18px;
  }

  /* Progress */
  .progress-cell { display: flex; align-items: center; gap: 6px; }
  .progress-bar-wrap { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .progress-bar-wrap.big { height: 8px; border-radius: 4px; margin: 4px 0; }
  .progress-bar-fill { height: 100%; border-radius: 3px; }
  .progress-section { margin: 12px 0; }
  .progress-label-row { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 3px; }

  /* Project detail header */
  .project-header {
    padding: 14px 16px; background: #f8fafc;
    border-radius: 8px; margin-bottom: 14px;
  }
  .project-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .project-meta-row { display: flex; gap: 20px; font-size: 11px; color: #64748b; flex-wrap: wrap; }
  .description { margin-top: 8px; font-size: 11px; color: #475569; line-height: 1.6; }

  /* Team pills */
  .team-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .team-pill {
    display: flex; align-items: center; gap: 5px;
    background: #f1f5f9; border: 1px solid #e2e8f0;
    border-radius: 99px; padding: 3px 10px; font-size: 10px;
  }
  .avatar-dot {
    width: 18px; height: 18px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    color: white; font-size: 8px; font-weight: 700; flex-shrink: 0;
  }

  /* Print */
  @media print {
    body { padding: 0; font-size: 10px; }
    .page-break { page-break-before: always; }
    .no-print { display: none !important; }
    .kpi-box { border: 1px solid #ccc; }
    .summary-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .badge, .semaforo, .kpi-val, .progress-bar-fill {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-logo">Area Leader <span>Pro</span></div>
      <div class="sub">Reporte de Gestión de Proyectos</div>
    </div>
    <div class="report-date">
      <div>Generado el</div>
      <div><strong>${fmt(generatedAt)}</strong></div>
      <div style="margin-top:4px">${projects.length} proyecto${projects.length!==1?'s':''}</div>
    </div>
  </div>

  ${globalSection}
  ${detailSections}

  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center">
    Area Leader Pro · angulodev.github.io/leader_pro · Generado automáticamente
  </div>
</body>
</html>`
}

// ══════════════════════════════════════════════════
export default function ExportModal({ onClose }) {
  const [projects, setProjects]   = useState([])
  const [selected, setSelected]   = useState(new Set())
  const [reportType, setReportType] = useState('full') // 'summary' | 'full'
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getProjects().then(p => {
      setProjects(p)
      setSelected(new Set(p.map(x => x.id))) // select all by default
    }).finally(() => setLoading(false))
  }, [])

  function toggleAll() {
    if (selected.size === projects.length) setSelected(new Set())
    else setSelected(new Set(projects.map(p => p.id)))
  }
  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleExport() {
    if (selected.size === 0) return
    setGenerating(true)
    try {
      const selectedProjects = projects.filter(p => selected.has(p.id))
      let detailData = {}

      if (reportType === 'full') {
        // Load detail data for each selected project
        await Promise.all(selectedProjects.map(async p => {
          const [tasks, risks, members] = await Promise.all([
            getTasksByProject(p.id),
            getRisksByProject(p.id),
            getProjectMembers(p.id),
          ])
          detailData[p.id] = { tasks, risks, members }
        }))
      }

      const html = buildReportHTML({
        projects: selectedProjects,
        detailData,
        reportType,
        generatedAt: new Date().toISOString(),
      })

      // Open print window
      const win = window.open('', '_blank', 'width=900,height=700')
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => {
        win.print()
      }, 500)

      onClose()
    } catch(e) {
      alert('Error al generar el reporte: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  const sc = (status) => STATUS_CFG[status] || STATUS_CFG.planning

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-lg" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="mat-icon" style={{fontSize:18,marginRight:6,verticalAlign:'middle'}}>picture_as_pdf</span>
            Exportar reporte
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <span className="mat-icon">close</span>
          </button>
        </div>

        <div className="modal-body" style={{ gap: 16 }}>

          {/* Report type */}
          <div className="form-group">
            <label className="form-label">Tipo de reporte</label>
            <div className="status-list">
              <button type="button"
                className={`status-list-item ${reportType === 'summary' ? 'sl-active selected' : ''}`}
                onClick={() => setReportType('summary')}>
                <span className="mat-icon sl-icon" style={{color:'#3b82f6'}}>table_chart</span>
                <div className="sl-text">
                  <span className="sl-label">Vista global</span>
                  <span className="sl-desc">Tabla resumen con semáforo, estado y progreso de todos los proyectos</span>
                </div>
                <span className="mat-icon sl-check" style={{opacity: reportType==='summary'?1:.25}}>
                  {reportType==='summary'?'radio_button_checked':'radio_button_unchecked'}
                </span>
              </button>
              <button type="button"
                className={`status-list-item ${reportType === 'full' ? 'sl-active selected' : ''}`}
                onClick={() => setReportType('full')}>
                <span className="mat-icon sl-icon" style={{color:'#8b5cf6'}}>description</span>
                <div className="sl-text">
                  <span className="sl-label">Reporte completo</span>
                  <span className="sl-desc">Vista global + detalle de cada proyecto: tareas, riesgos y equipo</span>
                </div>
                <span className="mat-icon sl-check" style={{opacity: reportType==='full'?1:.25}}>
                  {reportType==='full'?'radio_button_checked':'radio_button_unchecked'}
                </span>
              </button>
            </div>
          </div>

          {/* Project selector */}
          <div className="form-group">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label className="form-label">Seleccionar proyectos</label>
              <button className="link-btn" onClick={toggleAll}>
                {selected.size === projects.length ? 'Quitar todos' : 'Seleccionar todos'}
              </button>
            </div>

            {loading ? <Skeleton h={120}/> : (
              <div className="export-project-list">
                {projects.length === 0
                  ? <p className="empty-sub">No hay proyectos creados aún.</p>
                  : projects.map(p => {
                    const s = sc(p.status)
                    const isSelected = selected.has(p.id)
                    return (
                      <div key={p.id}
                        className={`export-project-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggle(p.id)}>
                        <div className={`export-checkbox ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <span className="mat-icon" style={{fontSize:15,color:'white'}}>check</span>}
                        </div>
                        <div className="export-project-dot" style={{ background: s.color }} />
                        <div className="export-project-info">
                          <div className="export-project-name">{p.name}</div>
                          <div className="export-project-meta">
                            <span style={{ color: s.color, fontSize:10, fontWeight:600 }}>{s.label}</span>
                            {p.client && <span className="sub"> · {p.client}</span>}
                          </div>
                        </div>
                        <div className="export-project-progress">
                          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{p.progress}%</div>
                          <div style={{ fontSize:9, color:'var(--text-muted)' }}>progreso</div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}
          </div>

          {/* Summary */}
          {selected.size > 0 && (
            <div className="export-summary-bar">
              <span className="mat-icon" style={{fontSize:16,color:'var(--accent)'}}>info</span>
              <span>
                Se exportarán <strong>{selected.size}</strong> proyecto{selected.size!==1?'s':''}
                {reportType === 'full' && ' con detalle completo de tareas, riesgos y equipo'}
                .
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary"
            onClick={handleExport}
            disabled={generating || selected.size === 0}>
            {generating
              ? <><span className="mat-icon spin">refresh</span> Generando…</>
              : <><span className="mat-icon">picture_as_pdf</span> Exportar PDF</>}
          </button>
        </div>
      </div>
    </div>
  )
}
