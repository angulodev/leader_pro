import { useEffect, useState } from 'react'
import { getTeamMembers, upsertMember, deleteMember } from '../lib/supabase'
import { Avatar, Skeleton, EmptyState } from './UI'

const COLORS = [
  '#3b82f6','#8b5cf6','#10b981','#f59e0b',
  '#ef4444','#06b6d4','#ec4899','#64748b',
]

const EMPTY_FORM = { name: '', initials: '', role: '', color: '#3b82f6', email: '' }

function initials(name) {
  return name.trim().split(' ').slice(0,2).map(w => w[0]?.toUpperCase() || '').join('')
}

export default function Team() {
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)   // null = new
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(null)
  const [error, setError]         = useState('')

  const load = () => {
    setLoading(true)
    getTeamMembers().then(setMembers).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  function openEdit(m) {
    setEditing(m)
    setForm({ name: m.name, initials: m.initials, role: m.role, color: m.color, email: m.email || '' })
    setError('')
    setShowModal(true)
  }

  function handleNameChange(val) {
    setForm(f => ({ ...f, name: val, initials: initials(val) }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) {
      setError('Nombre y rol son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await upsertMember({ ...form, id: editing?.id })
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(m) {
    if (!window.confirm(`¿Eliminar a ${m.name}? Esta acción no se puede deshacer.`)) return
    setDeleting(m.id)
    try {
      await deleteMember(m.id)
      load()
    } catch(e) {
      alert('Error al eliminar: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="screen-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Equipo</h1>
          <p className="page-sub">{members.length} personas · Área de proyectos</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <span className="mat-icon">person_add</span>
            <span>Agregar persona</span>
          </button>
        </div>
      </div>

      {/* Team grid */}
      {loading ? (
        <div className="team-grid-members">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} h={140} />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon="group_off" title="Sin miembros" sub="Agrega personas a tu equipo para comenzar." />
      ) : (
        <div className="team-grid-members">
          {members.map(m => (
            <div key={m.id} className="member-card">
              <div className="member-card-top">
                <Avatar initials={m.initials} color={m.color} size={52} />
                <div className="member-actions">
                  <button className="icon-btn" onClick={() => openEdit(m)} title="Editar">
                    <span className="mat-icon">edit</span>
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => handleDelete(m)}
                    disabled={deleting === m.id}
                    title="Eliminar"
                  >
                    <span className="mat-icon">{deleting === m.id ? 'hourglass_empty' : 'delete_outline'}</span>
                  </button>
                </div>
              </div>
              <div className="member-name">{m.name}</div>
              <div className="member-role">{m.role}</div>
              {m.email && (
                <div className="member-email">
                  <span className="mat-icon" style={{fontSize:13}}>mail_outline</span>
                  {m.email}
                </div>
              )}
              <div className="member-color-strip" style={{ background: m.color }} />
            </div>
          ))}

          {/* Add card */}
          <div className="member-card member-card-add" onClick={openNew}>
            <div className="add-person-icon">
              <span className="mat-icon">person_add</span>
            </div>
            <div className="member-name muted">Agregar miembro</div>
          </div>
        </div>
      )}

      {/* Table view */}
      {!loading && members.length > 0 && (
        <div className="card card-flush" style={{ marginTop: 4 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)' }}>
              Vista tabla
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Rol</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="row-hover">
                    <td>
                      <div className="td-leader">
                        <Avatar initials={m.initials} color={m.color} size={28} />
                        <div>
                          <div className="td-name">{m.name}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.role}</span></td>
                    <td><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email || '—'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" onClick={() => openEdit(m)}>
                          <span className="mat-icon">edit</span>
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(m)} disabled={deleting === m.id}>
                          <span className="mat-icon">delete_outline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar persona' : 'Nueva persona'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <span className="mat-icon">close</span>
              </button>
            </div>

            <div className="modal-body">
              {/* Preview */}
              <div className="member-preview">
                <Avatar initials={form.initials || '?'} color={form.color} size={56} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{form.name || 'Nombre'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{form.role || 'Rol'}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="ej. María López"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Iniciales</label>
                  <input
                    className="form-input"
                    value={form.initials}
                    onChange={e => setForm(f => ({ ...f, initials: e.target.value.toUpperCase().slice(0,3) }))}
                    placeholder="ML"
                    maxLength={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="maria@empresa.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rol / Cargo *</label>
                <input
                  className="form-input"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="ej. Backend Engineer"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color de avatar</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {error && <div className="form-error"><span className="mat-icon">error_outline</span>{error}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="mat-icon spin">refresh</span> Guardando…</> : <><span className="mat-icon">check</span> {editing ? 'Guardar cambios' : 'Crear persona'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
