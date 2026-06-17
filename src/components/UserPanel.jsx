import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getUserPrefs, saveUserPrefs } from '../lib/supabase'
import { Avatar } from './UI'

// ── Themes ──────────────────────────────────────────
export const THEMES = [
  {
    id: 'default',
    name: 'Océano',
    desc: 'Azul marino clásico',
    primary:  '#1e293b',
    accent:   '#3b82f6',
    success:  '#10b981',
    warning:  '#f59e0b',
    surface:  '#f7f9fb',
  },
  {
    id: 'slate',
    name: 'Pizarra',
    desc: 'Gris profesional',
    primary:  '#1e293b',
    accent:   '#6366f1',
    success:  '#10b981',
    warning:  '#f59e0b',
    surface:  '#f8fafc',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    desc: 'Verde corporativo',
    primary:  '#064e3b',
    accent:   '#059669',
    success:  '#10b981',
    warning:  '#f59e0b',
    surface:  '#f0fdf4',
  },
  {
    id: 'rose',
    name: 'Rosa',
    desc: 'Moderno y vibrante',
    primary:  '#881337',
    accent:   '#e11d48',
    success:  '#10b981',
    warning:  '#f59e0b',
    surface:  '#fff1f2',
  },
  {
    id: 'dark',
    name: 'Oscuro',
    desc: 'Modo noche',
    primary:  '#f8fafc',
    accent:   '#60a5fa',
    success:  '#34d399',
    warning:  '#fbbf24',
    surface:  '#0f172a',
    dark: true,
  },
  {
    id: 'purple',
    name: 'Violeta',
    desc: 'Creativo y moderno',
    primary:  '#3b0764',
    accent:   '#9333ea',
    success:  '#10b981',
    warning:  '#f59e0b',
    surface:  '#faf5ff',
  },
]

export function applyTheme(theme) {
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--accent',  theme.accent)
  root.style.setProperty('--success', theme.success)
  root.style.setProperty('--warning', theme.warning)
  root.style.setProperty('--surface', theme.surface)

  if (theme.dark) {
    root.style.setProperty('--surface-bright',  '#1e293b')
    root.style.setProperty('--border',          '#334155')
    root.style.setProperty('--text-primary',    '#f1f5f9')
    root.style.setProperty('--text-secondary',  '#94a3b8')
    root.style.setProperty('--text-muted',      '#64748b')
    root.style.setProperty('--accent-bg',       '#1e3a5f')
    root.style.setProperty('--success-bg',      '#064e3b')
    root.style.setProperty('--warning-bg',      '#451a03')
    root.style.setProperty('--error-bg',        '#450a0a')
    root.style.setProperty('--purple-bg',       '#2e1065')
    root.style.setProperty('--secondary',       '#94a3b8')
    // Override hardcoded whites/shadows for dark mode
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
    root.style.setProperty('--surface-bright',  '#ffffff')
    root.style.setProperty('--border',          '#e2e8f0')
    root.style.setProperty('--text-primary',    '#1e293b')
    root.style.setProperty('--text-secondary',  '#64748b')
    root.style.setProperty('--text-muted',      '#94a3b8')
    root.style.setProperty('--accent-bg',       '#eff6ff')
    root.style.setProperty('--success-bg',      '#d1fae5')
    root.style.setProperty('--warning-bg',      '#fef3c7')
    root.style.setProperty('--error-bg',        '#fee2e2')
    root.style.setProperty('--purple-bg',       '#ede9fe')
  }
}

// ── Profile Panel ────────────────────────────────────
export default function UserPanel({ onClose }) {
  const panelRef = useRef(null)
  const [prefs, setPrefs] = useState(getUserPrefs)
  const [form, setForm]   = useState({
    name:  prefs.name  || 'Francisco A.',
    role:  prefs.role  || 'Area Leader',
    email: prefs.email || '',
    color: prefs.color || '#1e293b',
    splashTitle:    prefs.splashTitle    || '',
    splashSubtitle: prefs.splashSubtitle || '',
    splashLogo:     prefs.splashLogo     || '',
  })
  const [saved, setSaved]         = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Close on outside click
  useEffect(() => {
    function h(e) { if (panelRef.current && !panelRef.current.contains(e.target)) onClose() }
    setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  // Apply saved theme on mount
  useEffect(() => {
    if (prefs.themeId) {
      const t = THEMES.find(t => t.id === prefs.themeId)
      if (t) applyTheme(t)
    }
  }, [])

  function handleSaveProfile() {
    saveUserPrefs(form)
    setPrefs(p => ({ ...p, ...form }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleTheme(theme) {
    applyTheme(theme)
    saveUserPrefs({ themeId: theme.id })
    setPrefs(p => ({ ...p, themeId: theme.id }))
  }

  const currentTheme = THEMES.find(t => t.id === (prefs.themeId || 'default')) || THEMES[0]
  const initials = form.name.trim().split(' ').slice(0,2).map(w => w[0]?.toUpperCase() || '').join('')

  const AVATAR_COLORS = ['#1e293b','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899']

  return (
    <div className="user-panel" ref={panelRef}>

      {/* Header */}
      <div className="user-panel-header">
        <div className="user-panel-identity">
          <Avatar initials={initials} color={form.color} size={44} />
          <div>
            <div className="user-panel-name">{form.name}</div>
            <div className="user-panel-role">{form.role}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <span className="mat-icon">close</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="user-panel-tabs">
        {[
          { id: 'profile', icon: 'person',   label: 'Perfil'  },
          { id: 'theme',   icon: 'palette',  label: 'Tema'    },
          { id: 'prefs',   icon: 'tune',     label: 'Ajustes' },
        ].map(t => (
          <button key={t.id}
            className={`user-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            <span className="mat-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="user-panel-body">

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="user-section">
            <div className="form-group">
              <label className="form-label">Nombre mostrado</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo / Rol</label>
              <input className="form-input" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="ej. Area Leader" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Color de avatar</label>
              <div className="color-picker">
                {AVATAR_COLORS.map(c => (
                  <button key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>

            <div className="user-section-divider">Pantalla de presentación</div>

            <div className="form-group">
              <label className="form-label">Título principal</label>
              <input className="form-input" value={form.splashTitle}
                onChange={e => setForm(f => ({ ...f, splashTitle: e.target.value }))}
                placeholder="ej. Gestión de Proyectos 2026"/>
            </div>
            <div className="form-group">
              <label className="form-label">Subtítulo</label>
              <input className="form-input" value={form.splashSubtitle}
                onChange={e => setForm(f => ({ ...f, splashSubtitle: e.target.value }))}
                placeholder="ej. Empresa ABC · Q3 2026"/>
            </div>
            <div className="form-group">
              <label className="form-label">Logo (URL de imagen)</label>
              <input className="form-input" value={form.splashLogo}
                onChange={e => setForm(f => ({ ...f, splashLogo: e.target.value }))}
                placeholder="https://empresa.cl/logo.png"/>
              {form.splashLogo && (
                <div style={{marginTop:8,padding:12,background:'var(--surface)',borderRadius:'var(--radius)',textAlign:'center'}}>
                  <img src={form.splashLogo} alt="preview" style={{maxHeight:48,maxWidth:'100%',objectFit:'contain'}}
                    onError={e=>e.target.style.display='none'}/>
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
              onClick={handleSaveProfile}>
              {saved
                ? <><span className="mat-icon">check_circle</span> Guardado</>
                : <><span className="mat-icon">save</span> Guardar perfil</>}
            </button>
          </div>
        )}

        {/* ── THEME ── */}
        {activeTab === 'theme' && (
          <div className="user-section">
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
              El tema se aplica inmediatamente y se guarda para tu próxima visita.
            </p>
            <div className="theme-grid">
              {THEMES.map(t => (
                <button key={t.id}
                  className={`theme-card ${currentTheme.id === t.id ? 'selected' : ''}`}
                  onClick={() => handleTheme(t)}>
                  {/* Preview */}
                  <div className="theme-preview" style={{ background: t.surface }}>
                    <div className="theme-preview-bar" style={{ background: t.primary }} />
                    <div className="theme-preview-accent" style={{ background: t.accent }} />
                    <div className="theme-preview-dots">
                      <span style={{ background: t.success }} />
                      <span style={{ background: t.warning }} />
                      <span style={{ background: '#ef4444' }} />
                    </div>
                  </div>
                  <div className="theme-name">{t.name}</div>
                  <div className="theme-desc">{t.desc}</div>
                  {currentTheme.id === t.id && (
                    <span className="mat-icon theme-check">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PREFS ── */}
        {activeTab === 'prefs' && (
          <div className="user-section">
            <div className="pref-row">
              <div className="pref-info">
                <div className="pref-label">Compactar tablas</div>
                <div className="pref-desc">Reduce el padding en filas de tablas</div>
              </div>
              <button
                className={`pref-toggle ${prefs.compact ? 'on' : ''}`}
                onClick={() => {
                  const v = !prefs.compact
                  saveUserPrefs({ compact: v })
                  setPrefs(p => ({ ...p, compact: v }))
                  document.documentElement.classList.toggle('compact', v)
                }}>
                <span className="pref-toggle-thumb" />
              </button>
            </div>

            <div className="pref-row">
              <div className="pref-info">
                <div className="pref-label">Sidebar abierto por defecto</div>
                <div className="pref-desc">Al cargar la app en desktop</div>
              </div>
              <button
                className={`pref-toggle ${prefs.sidebarOpen !== false ? 'on' : ''}`}
                onClick={() => {
                  const v = prefs.sidebarOpen === false ? true : false
                  saveUserPrefs({ sidebarOpen: v })
                  setPrefs(p => ({ ...p, sidebarOpen: v }))
                }}>
                <span className="pref-toggle-thumb" />
              </button>
            </div>

            <div className="pref-divider" />

            <div className="pref-row">
              <div className="pref-info">
                <div className="pref-label" style={{ color:'var(--error)' }}>Limpiar preferencias</div>
                <div className="pref-desc">Restaura tema y ajustes por defecto</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--error)' }}
                onClick={() => {
                  localStorage.removeItem('alp_user_prefs')
                  localStorage.removeItem('alp_read')
                  setPrefs({})
                  setForm({ name:'Francisco A.', role:'Area Leader', email:'', color:'#1e293b' })
                  applyTheme(THEMES[0])
                }}>
                <span className="mat-icon">restart_alt</span>
              </button>
            </div>

            <div className="pref-divider" />
            <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>
              <strong>Area Leader Pro</strong> v1.0.0<br/>
              React 18 + Vite + Supabase<br/>
              <a href="https://github.com/angulodev/leader_pro" target="_blank"
                rel="noreferrer" style={{ color:'var(--accent)' }}>
                Ver en GitHub →
              </a>
            </div>

            <div className="pref-divider" />

            {/* Logout */}
            <button
              className="btn btn-danger"
              style={{ width:'100%', justifyContent:'center' }}
              onClick={async () => {
                await supabase.auth.signOut()
                onClose()
              }}
            >
              <span className="mat-icon">logout</span>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
