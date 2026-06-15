import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import ProjectDetail from './components/ProjectDetail'
import Workload from './components/Workload'
import './index.css'

const NAV = [
  { id: 'dashboard', icon: 'grid_view',       label: 'Dashboard'  },
  { id: 'projects',  icon: 'folder_open',      label: 'Proyectos'  },
  { id: 'workload',  icon: 'groups',           label: 'Equipo'     },
  { id: 'reports',   icon: 'bar_chart',        label: 'Reportes'   },
]
const NAV_BOTTOM = [
  { id: 'settings',  icon: 'settings',         label: 'Configuración' },
]

export default function App() {
  const [screen, setScreen] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [sideOpen, setSideOpen] = useState(false)

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

  return (
    <div className="app">
      {/* ── TOP NAV ── */}
      <header className="topnav">
        <button className="icon-btn mobile-menu-btn" onClick={() => setSideOpen(o => !o)} aria-label="Menu">
          <span className="mat-icon">menu</span>
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
        {/* ── SIDEBAR OVERLAY (mobile) ── */}
        {sideOpen && <div className="sidebar-overlay" onClick={() => setSideOpen(false)} />}

        {/* ── SIDEBAR ── */}
        <aside className={`sidenav ${sideOpen ? 'open' : ''}`}>
          <div className="sidenav-inner">
            <nav className="sidenav-main">
              <div className="sidenav-section-label">Principal</div>
              {NAV.map(n => (
                <button
                  key={n.id}
                  className={`nav-item ${screen === n.id || (screen === 'project-detail' && n.id === 'projects') ? 'active' : ''}`}
                  onClick={() => navigate(n.id)}
                >
                  <span className="mat-icon nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                  {n.id === 'projects' && <span className="nav-badge">7</span>}
                </button>
              ))}

              <div className="sidenav-divider" />
              <div className="sidenav-section-label">Proyectos activos</div>
              <button className="nav-item sub" onClick={() => navigate('projects')}>
                <span className="mat-icon nav-icon">rocket_launch</span>
                <span>Infra Modernization</span>
              </button>
              <button className="nav-item sub" onClick={() => navigate('projects')}>
                <span className="mat-icon nav-icon">security</span>
                <span>Security Upgrade</span>
              </button>
              <button className="nav-item sub" onClick={() => navigate('projects')}>
                <span className="mat-icon nav-icon">cloud_upload</span>
                <span>Cloud Migration</span>
              </button>
            </nav>

            <div className="sidenav-bottom">
              <div className="sidenav-divider" />
              {NAV_BOTTOM.map(n => (
                <button key={n.id} className="nav-item" onClick={() => navigate(n.id)}>
                  <span className="mat-icon nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          {screen === 'dashboard'      && <Dashboard onNavigate={navigate} />}
          {screen === 'projects'       && <Projects onSelectProject={selectProject} />}
          {screen === 'project-detail' && <ProjectDetail project={selectedProject} onBack={() => navigate('projects')} />}
          {screen === 'workload'       && <Workload />}
          {screen === 'reports'        && (
            <div className="screen-content">
              <div className="page-header"><h1 className="page-title">Reportes</h1></div>
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <span className="mat-icon" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>bar_chart</span>
                Módulo de reportes disponible próximamente
              </div>
            </div>
          )}
          {screen === 'settings' && (
            <div className="screen-content">
              <div className="page-header"><h1 className="page-title">Configuración</h1></div>
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <span className="mat-icon" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>settings</span>
                Configuración del área
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
            className={`bottom-nav-item ${screen === n.id ? 'active' : ''}`}
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
