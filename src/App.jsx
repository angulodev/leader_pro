import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import ProjectDetail from './components/ProjectDetail'
import Workload from './components/Workload'
import Team from './components/Team'
import Reports from './components/Reports'
import { getProjects, getActivity, getActiveProjects, getUserPrefs } from './lib/supabase'
import UserPanel, { applyTheme, THEMES } from './components/UserPanel'
import ExportModal from './components/ExportModal'
import Notifications from './components/Notifications'
import './index.css'

const NAV = [
  { id: 'dashboard', icon: 'grid_view',      label: 'Dashboard' },
  { id: 'projects',  icon: 'folder_open',    label: 'Proyectos' },
  { id: 'team',      icon: 'groups',         label: 'Equipo'    },
  { id: 'workload',  icon: 'balance',        label: 'Carga'     },
  { id: 'reports',   icon: 'bar_chart',      label: 'Reportes'  },
  { id: 'export',    icon: 'picture_as_pdf', label: 'Exportar'  },
]

export default function App() {
  const [screen, setScreen]               = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [sideOpen, setSideOpen]           = useState(window.innerWidth > 640)
  const [projectCount, setProjectCount]   = useState(null)
  const [notifOpen, setNotifOpen]         = useState(false)
  const [userPanelOpen, setUserPanelOpen] = useState(false)
  const [exportOpen, setExportOpen]       = useState(false)
  const [activeProjects, setActiveProjects] = useState([])
  const [userPrefs, setUserPrefs]         = useState(getUserPrefs)
  const [unreadCount, setUnreadCount]     = useState(0)

  useEffect(() => {
    getProjects().then(p => setProjectCount(p.length)).catch(() => setProjectCount(0))
    getActiveProjects().then(setActiveProjects).catch(() => {})
    // Apply saved theme
    const prefs = getUserPrefs()
    if (prefs.themeId) {
      const t = THEMES.find(t => t.id === prefs.themeId)
      if (t) applyTheme(t)
    }
    if (prefs.compact) document.documentElement.classList.add('compact')
    // Count unread notifications
    getActivity(20).then(items => {
      const read = JSON.parse(localStorage.getItem('alp_read') || '[]')
      setUnreadCount(items.filter(i => !read.includes(i.id)).length)
    }).catch(() => {})
  }, [])

  function navigate(id) {
    if (id === 'export') {
      setExportOpen(true)
      setSideOpen(false)
      return
    }
    setScreen(id)
    setSelectedProject(null)
    setSideOpen(false)
  }

  function selectProject(p) {
    setSelectedProject(p)
    setScreen('project-detail')
    setSideOpen(false)
  }

  const activeNav = screen === 'project-detail' ? 'projects' : screen
  const isExportActive = exportOpen

  return (
    <div className="app">
      {/* ── TOP NAV ── */}
      <header className="topnav">
        <button
          className="icon-btn mobile-menu-btn"
          onClick={() => setSideOpen(o => !o)}
          aria-label="Menú"
        >
          <span className="mat-icon">{sideOpen ? 'close' : 'menu'}</span>
        </button>
        <div className="brand">
          <div className="brand-icon"><span className="mat-icon">hub</span></div>
          <span className="brand-name">Area Leader Pro</span>
        </div>
        <div className="topnav-search">
          <span className="mat-icon search-icon-nav">search</span>
          <input type="text" placeholder="Buscar proyectos, tareas…" />
        </div>
        <div className="topnav-actions">
          <div style={{ position: 'relative' }}>
            <button className="icon-btn notif-btn" aria-label="Notificaciones"
              onClick={() => setNotifOpen(o => !o)}>
              <span className="mat-icon">{notifOpen ? 'notifications' : 'notifications_none'}</span>
              {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notifOpen && (
              <Notifications onClose={() => setNotifOpen(false)} />
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <div className="avatar-circle topnav-avatar"
              style={{ background: userPrefs.color || '#1e293b', fontSize: 12, cursor: 'pointer' }}
              onClick={() => { setUserPanelOpen(o => !o); setNotifOpen(false) }}>
              {(userPrefs.name || 'FA').trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')}
            </div>
            {userPanelOpen && <UserPanel onClose={() => setUserPanelOpen(false)} />}
          </div>
        </div>
      </header>

      <div className="layout">
        {/* ── SIDEBAR OVERLAY ── */}
        {sideOpen && <div className="sidebar-overlay" onClick={() => setSideOpen(false)} />}

        {/* ── SIDEBAR ── */}
        <aside className={`sidenav ${sideOpen ? 'open' : ''}`}>
          <div className="sidenav-inner">

            {/* Main nav */}
            <nav className="sidenav-main">
              <div className="sidenav-section-label">Principal</div>
              {NAV.map(n => (
                <button
                  key={n.id}
                  className={`nav-item ${n.id === 'export' ? (isExportActive ? 'active' : '') : activeNav === n.id ? 'active' : ''}`}
                  onClick={() => navigate(n.id)}
                >
                  <span className="mat-icon nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                  {n.id === 'projects' && projectCount > 0 && <span className="nav-badge">{projectCount}</span>}
                </button>
              ))}
            </nav>

            {/* Active projects — compact, no wasted space */}
            <div className="sidenav-projects-section">
              <div className="sidenav-divider" />
              <div className="sidenav-section-label">Proyectos activos</div>
              {activeProjects.length === 0
                ? <div style={{fontSize:11,color:'var(--text-muted)',padding:'4px 10px'}}>Sin proyectos activos</div>
                : activeProjects.map(p => (
                  <button key={p.id} className="nav-item nav-item-project" onClick={() => navigate('projects')}>
                    <span className="project-dot" style={{ background: p.leader_color || 'var(--accent)' }} />
                    <span className="nav-item-project-label">{p.name}</span>
                  </button>
                ))
              }
            </div>

            {/* Bottom */}
            <div className="sidenav-bottom">
              <div className="sidenav-divider" />
              <button className="nav-item" onClick={() => navigate('settings')}>
                <span className="mat-icon nav-icon">settings</span>
                <span>Configuración</span>
              </button>

              {/* User info at bottom */}
              <div className="sidenav-user" onClick={() => { setUserPanelOpen(true); setSideOpen(false) }}
                style={{ cursor:'pointer', borderRadius:'var(--radius)', transition:'background .12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="avatar-circle" style={{ width:32, height:32, background: userPrefs.color||'#1e293b', fontSize:12, flexShrink:0 }}>
                  {(userPrefs.name||'FA').trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')}
                </div>
                <div className="sidenav-user-info">
                  <div className="sidenav-user-name">{userPrefs.name || 'Francisco A.'}</div>
                  <div className="sidenav-user-role">{userPrefs.role || 'Area Leader'}</div>
                </div>
                <span className="mat-icon" style={{fontSize:16,color:'var(--text-muted)',marginLeft:'auto'}}>settings</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          {screen === 'dashboard'      && <Dashboard onNavigate={navigate} onExport={() => setExportOpen(true)} />}
          {screen === 'projects'       && <Projects onSelectProject={selectProject} />}
          {screen === 'project-detail' && <ProjectDetail project={selectedProject} onBack={() => navigate('projects')} />}
          {screen === 'team'           && <Team />}
          {screen === 'workload'       && <Workload />}
          {screen === 'reports'  && <Reports />}
          {screen === 'settings' && (
            <div className="screen-content">
              <div className="page-header"><h1 className="page-title">Configuración</h1></div>
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <span className="mat-icon" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>settings</span>
                Módulo disponible próximamente
              </div>
            </div>
          )}
        </main>
      </div>

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`bottom-nav-item ${n.id === 'export' ? (isExportActive ? 'active' : '') : activeNav === n.id ? 'active' : ''}`}
            onClick={() => navigate(n.id)}
          >
            <span className="mat-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
