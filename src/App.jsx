import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import ProjectDetail from './components/ProjectDetail'
import Workload from './components/Workload'
import Team from './components/Team'
import { getProjects } from './lib/supabase'
import './index.css'

const NAV = [
  { id: 'dashboard', icon: 'grid_view',    label: 'Dashboard'  },
  { id: 'projects',  icon: 'folder_open',  label: 'Proyectos'  },
  { id: 'team',      icon: 'groups',       label: 'Equipo'     },
  { id: 'workload',  icon: 'balance',      label: 'Carga'      },
  { id: 'reports',   icon: 'bar_chart',    label: 'Reportes'   },
]

export default function App() {
  const [screen, setScreen]               = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [sideOpen, setSideOpen]           = useState(window.innerWidth > 640)
  const [projectCount, setProjectCount]   = useState(null)

  useEffect(() => {
    getProjects().then(p => setProjectCount(p.length)).catch(() => setProjectCount(0))
  }, [])

  function navigate(id) {
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
          <button className="icon-btn notif-btn" aria-label="Notificaciones">
            <span className="mat-icon">notifications_none</span>
            <span className="notif-dot" />
          </button>
          <button className="icon-btn" aria-label="Ayuda">
            <span className="mat-icon">help_outline</span>
          </button>
          <div className="avatar-circle topnav-avatar" style={{ background: '#1e293b', fontSize: 12 }}>FA</div>
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
                  className={`nav-item ${activeNav === n.id ? 'active' : ''}`}
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
              {[
                { icon: 'rocket_launch', label: 'Infra Modernization', color: '#3b82f6' },
                { icon: 'security',      label: 'Security Upgrade',    color: '#8b5cf6' },
                { icon: 'cloud_upload',  label: 'Cloud Migration',     color: '#10b981' },
              ].map(p => (
                <button key={p.label} className="nav-item nav-item-project" onClick={() => navigate('projects')}>
                  <span className="project-dot" style={{ background: p.color }} />
                  <span className="nav-item-project-label">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Bottom */}
            <div className="sidenav-bottom">
              <div className="sidenav-divider" />
              <button className="nav-item" onClick={() => navigate('settings')}>
                <span className="mat-icon nav-icon">settings</span>
                <span>Configuración</span>
              </button>

              {/* User info at bottom */}
              <div className="sidenav-user">
                <div className="avatar-circle" style={{ width: 32, height: 32, background: '#1e293b', fontSize: 12, flexShrink: 0 }}>FA</div>
                <div className="sidenav-user-info">
                  <div className="sidenav-user-name">Francisco A.</div>
                  <div className="sidenav-user-role">Area Leader</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          {screen === 'dashboard'      && <Dashboard onNavigate={navigate} />}
          {screen === 'projects'       && <Projects onSelectProject={selectProject} />}
          {screen === 'project-detail' && <ProjectDetail project={selectedProject} onBack={() => navigate('projects')} />}
          {screen === 'team'           && <Team />}
          {screen === 'workload'       && <Workload />}
          {(screen === 'reports' || screen === 'settings') && (
            <div className="screen-content">
              <div className="page-header">
                <h1 className="page-title">{screen === 'reports' ? 'Reportes' : 'Configuración'}</h1>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <span className="mat-icon" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>
                  {screen === 'reports' ? 'bar_chart' : 'settings'}
                </span>
                Módulo disponible próximamente
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`bottom-nav-item ${activeNav === n.id ? 'active' : ''}`}
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
