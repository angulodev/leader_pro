import { useEffect, useState } from 'react'
import { getTeamMembers, upsertProject } from '../lib/supabase'
import { Avatar } from './UI'

const STATUSES = [
  { value: 'planning',  label: 'Planificación' },
  { value: 'on-track',  label: 'On Track'      },
  { value: 'at-risk',   label: 'At Risk'        },
  { value: 'delayed',   label: 'Delayed'        },
  { value: 'completed', label: 'Completado'     },
]

const EMPTY = {
  name: '', client: '', status: 'planning',
  progress: 0, estimated: 0, budget: '',
  leader_id: '', due_date: '', description: '',
}

export default function ProjectModal({ project, onClose, onSaved }) {
  const [form, setForm]       = useState(project ? {
    ...EMPTY,
    name:        project.name        || '',
    client:      project.client      || '',
    status:      project.status      || 'planning',
    progress:    project.progress    || 0,
    estimated:   project.estimated   || 0,
    leader_id:   project.leader_id   || '',
    due_date:    project.due_date    || '',
    description: project.description || '',
  } : EMPTY)
  const [members, setMembers] = useState([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    getTeamMembers().then(setMembers).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError('')
    try {
      await upsertProject({ ...form, id: project?.id })
      onSaved()
    } catch(e) { setError(e.message || 'Error al guardar.') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <span className="mat-icon">close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre del proyecto *</label>
            <input className="form-input" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="ej. Modernizing Enterprise Infrastructure" autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cliente / Área</label>
              <input className="form-input" value={form.client}
                onChange={e => set('client', e.target.value)}
                placeholder="ej. IT Department" />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Progreso real ({form.progress}%)</label>
              <input type="range" min={0} max={100} value={form.progress}
                onChange={e => set('progress', parseInt(e.target.value))}
                className="form-range" />
              <div className="range-track-label">
                <span>0%</span><span style={{fontWeight:600,color:'var(--accent)'}}>{form.progress}%</span><span>100%</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Estimado ({form.estimated}%)</label>
              <input type="range" min={0} max={100} value={form.estimated}
                onChange={e => set('estimated', parseInt(e.target.value))}
                className="form-range" />
              <div className="range-track-label">
                <span>0%</span><span style={{fontWeight:600,color:'var(--secondary)'}}>{form.estimated}%</span><span>100%</span>
              </div>
            </div>
          </div>

          <div className="form-row">
              <div className="form-group">
              <label className="form-label">Fecha de entrega</label>
              <input className="form-input" type="date" value={form.due_date}
                onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>

          {/* Líder */}
          <div className="form-group">
            <label className="form-label">Líder del proyecto</label>
            <div className="leader-picker">
              <button
                className={`leader-option ${!form.leader_id ? 'selected' : ''}`}
                onClick={() => set('leader_id', '')}
              >
                <div className="leader-none-avatar"><span className="mat-icon">person_off</span></div>
                <span>Sin líder</span>
              </button>
              {members.map(m => (
                <button key={m.id}
                  className={`leader-option ${form.leader_id === m.id ? 'selected' : ''}`}
                  onClick={() => set('leader_id', m.id)}
                  title={m.name}
                >
                  <Avatar initials={m.initials} color={m.color} size={32} />
                  <span>{m.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe el objetivo del proyecto…" style={{ resize: 'vertical' }} />
          </div>

          {error && <div className="form-error"><span className="mat-icon">error_outline</span>{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="mat-icon spin">refresh</span> Guardando…</>
              : <><span className="mat-icon">check</span> {project ? 'Guardar cambios' : 'Crear proyecto'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
