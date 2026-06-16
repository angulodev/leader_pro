import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import ProjectDetail from './components/ProjectDetail'
import Workload from './components/Workload'
import Team from './components/Team'
import Reports from './components/Reports'
import Notifications from './components/Notifications'
import UserPanel, { applyTheme, THEMES } from './components/UserPanel'
import ExportModal from './components/ExportModal'
import { getProjects, getActivity, getUserPrefs, supabase } from './lib/supabase'
import Login from './components/Login'
import './index.css'

const NAV = [
  { id: 'dashboard', path: '/',          icon: 'grid_view',      label: 'Dashboard' },
  { id: 'projects',  path: '/projects',  icon: 'folder_open',    label: 'Proyectos' },
  { id: 'team',      path: '/team',      icon: 'groups',         label: 'Equipo'    },
  { id: 'workload',  path: '/workload',  icon: 'balance',        label: 'Carga'     },
  { id: 'reports',   path: '/reports',   icon: 'bar_chart',      label: 'Reportes'  },
  { id: 'export',    path: null,         icon: 'picture_as_pdf', label: 'Exportar'  },
]

// ── Inner app (needs router context) ──────────────
function AppInner() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [session,        setSession]        = useState(null)
  const [authLoading,    setAuthLoading]    = useState(true)
  const [sideOpen,       setSideOpen]       = useState(window.innerWidth > 640)
  const [sidePinned,     setSidePinned]     = useState(() => {
    const prefs = getUserPrefs()
    return prefs.sidebarPinned !== false && window.innerWidth > 640
  })
  const [notifOpen,      setNotifOpen]      = useState(false)
  const [userPanelOpen,  setUserPanelOpen]  = useState(false)
  const [exportOpen,     setExportOpen]     = useState(false)
  const [projectCount,   setProjectCount]   = useState(null)
  const [activeProjects, setActiveProjects] = useState([])
  const [unreadCount,    setUnreadCount]    = useState(0)
  const [userPrefs,      setUserPrefs]      = useState(getUserPrefs)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    getProjects().then(p => {
      setProjectCount(p.length)
      setActiveProjects(
        p.filter(x => ['active','at-risk','planning'].includes(x.status))
          .sort((a,b) => new Date(b.updated_at||b.created_at) - new Date(a.updated_at||a.created_at))
          .slice(0, 6)
      )
    }).catch(() => {})
    getActivity(20).then(items => {
      const read = JSON.parse(localStorage.getItem('alp_read') || '[]')
      setUnreadCount(items.filter(i => !read.includes(i.id)).length)
    }).catch(() => {})
    const prefs = getUserPrefs()
    if (prefs.themeId) { const t = THEMES.find(t => t.id === prefs.themeId); if (t) applyTheme(t) }
    if (prefs.compact) document.documentElement.classList.add('compact')
  }, [session])

  // Current nav id from path
  const activeNav = location.pathname === '/'           ? 'dashboard'
    : location.pathname.startsWith('/projects/')        ? 'projects'
    : location.pathname.startsWith('/projects')         ? 'projects'
    : location.pathname.startsWith('/team')             ? 'team'
    : location.pathname.startsWith('/workload')         ? 'workload'
    : location.pathname.startsWith('/reports')          ? 'reports'
    : 'dashboard'

  const STATUS_COLOR = {
    active:'#10b981','at-risk':'#f59e0b',planning:'#3b82f6',
    'on-hold':'#8b5cf6',backlog:'#94a3b8',completed:'#06b6d4'
  }

  function goNav(nav) {
    if (nav.path === null) { setExportOpen(true); if (!sidePinned) setSideOpen(false); return }
    navigate(nav.path)
    if (!sidePinned) setSideOpen(false)
  }

  if (authLoading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'var(--surface)'}}>
      <div style={{textAlign:'center',color:'var(--text-muted)'}}>
        <span className="mat-icon spin" style={{fontSize:36,display:'block',marginBottom:8}}>hub</span>
        <div style={{fontSize:14,fontWeight:600}}>Area Leader Pro</div>
      </div>
    </div>
  )

  if (!session) return <Login />

  return (
    <div className="app">
      {/* ── TOP NAV ── */}
      <header className="topnav">
        <button className="icon-btn mobile-menu-btn" onClick={() => setSideOpen(o => !o)}>
          <span className="mat-icon">{sideOpen ? 'close' : 'menu'}</span>
        </button>
        <div className="brand" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
          <div className="brand-icon"><span className="mat-icon">hub</span></div>
          <span className="brand-name">Area Leader Pro</span>
        </div>
        {/* Pin sidebar button — desktop only, next to brand */}
        <button
          className={`icon-btn sidebar-pin-topnav ${sidePinned ? 'pinned' : ''}`}
          onClick={() => {
            const next = !sidePinned
            setSidePinned(next)
            if (!next) setSideOpen(false)
            else setSideOpen(true)
            try {
              const k = 'alp_user_prefs'
              const cur = JSON.parse(localStorage.getItem(k) || '{}')
              localStorage.setItem(k, JSON.stringify({ ...cur, sidebarPinned: next }))
            } catch(e) {}
          }}
          title={sidePinned ? 'Desanclar sidebar' : 'Anclar sidebar'}
        >
          <span className="mat-icon" style={{fontSize:18, transform: sidePinned ? 'rotate(-45deg)' : 'none', transition:'transform .2s'}}>push_pin</span>
        </button>
        <div className="topnav-search">
          <span className="mat-icon search-icon-nav">search</span>
          <input type="text" placeholder="Buscar proyectos, tareas…" />
        </div>
        <div className="topnav-actions">
          <div style={{ position: 'relative' }}>
            <button className="icon-btn notif-btn"
              onClick={() => { setNotifOpen(o => !o); setUserPanelOpen(false) }}>
              <span className="mat-icon">{notifOpen ? 'notifications' : 'notifications_none'}</span>
              {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notifOpen && <Notifications onClose={() => setNotifOpen(false)} />}
          </div>
          <button className="icon-btn" title="Cerrar sesión"
            onClick={async () => { await supabase.auth.signOut(); setSession(null) }}>
            <span className="mat-icon">logout</span>
          </button>
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
        {sideOpen && !sidePinned && <div className="sidebar-overlay" onClick={() => setSideOpen(false)} />}

        {/* ── SIDEBAR ── */}
        <aside className={`sidenav ${sideOpen ? 'open' : ''} ${sidePinned ? 'pinned' : ''}`}>
          <div className="sidenav-inner">
            <nav className="sidenav-main">
              <div className="sidenav-section-label">Principal</div>
              {NAV.map(n => (
                <button key={n.id}
                  className={`nav-item ${n.id === 'export' ? (exportOpen ? 'active' : '') : activeNav === n.id ? 'active' : ''}`}
                  onClick={() => goNav(n)}>
                  <span className="mat-icon nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                  {n.id === 'projects' && projectCount > 0 &&
                    <span className="nav-badge">{projectCount}</span>}
                </button>
              ))}
            </nav>

            <div className="sidenav-projects-section">
              <div className="sidenav-divider" />
              <div className="sidenav-section-label">Proyectos activos</div>
              {activeProjects.length === 0
                ? <div style={{fontSize:11,color:'var(--text-muted)',padding:'4px 10px'}}>Sin proyectos activos</div>
                : activeProjects.map(p => (
                  <button key={p.id} className="nav-item nav-item-project"
                    onClick={() => { navigate(`/projects/${p.id}`); if (!sidePinned) setSideOpen(false) }}>
                    <span className="project-dot" style={{ background: STATUS_COLOR[p.status] || 'var(--accent)' }} />
                    <span className="nav-item-project-label">{p.name}</span>
                  </button>
                ))
              }
            </div>

            <div className="sidenav-bottom">
              <div className="sidenav-divider" />
              <div className="sidenav-user\"
                onClick={() => { setUserPanelOpen(true); if (!sidePinned) setSideOpen(false) }}
                style={{cursor:'pointer',borderRadius:'var(--radius)',transition:'background .12s'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="avatar-circle" style={{width:32,height:32,background:userPrefs.color||'#1e293b',fontSize:12,flexShrink:0}}>
                  {(userPrefs.name||'FA').trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')}
                </div>
                <div className="sidenav-user-info">
                  <div className="sidenav-user-name">{userPrefs.name || 'Francisco A.'}</div>
                  <div className="sidenav-user-role">{userPrefs.role || 'Area Leader'}</div>
                </div>
                <button className="icon-btn" style={{width:28,height:28,flexShrink:0,marginLeft:'auto'}}
                  onClick={e=>{e.stopPropagation();navigate('/settings');if(!sidePinned)setSideOpen(false)}}
                  title="Configuración">
                  <span className="mat-icon" style={{fontSize:17}}>settings</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          <Routes>
            <Route path="/"           element={<Dashboard onNavigate={p=>navigate(p==='projects'?'/projects':p==='team'?'/team':p==='workload'?'/workload':'/') } onExport={() => setExportOpen(true)} />} />
            <Route path="/projects"   element={<Projects  onSelectProject={p => navigate(`/projects/${p.id}`, { state: { project: p } })} />} />
            <Route path="/projects/:id" element={<ProjectDetailRoute />} />
            <Route path="/team"       element={<Team />} />
            <Route path="/workload"   element={<Workload />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/settings"   element={
              <div className="screen-content">
                <div className="page-header"><h1 className="page-title">Configuración</h1></div>
                <div className="card" style={{textAlign:'center',padding:48,color:'var(--text-muted)'}}>
                  <span className="mat-icon" style={{fontSize:40,display:'block',marginBottom:12}}>settings</span>
                  Módulo disponible próximamente
                </div>
              </div>
            } />
            <Route path="*" element={<Dashboard onNavigate={p=>navigate(p)} onExport={() => setExportOpen(true)} />} />
          </Routes>
        </main>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button key={n.id}
            className={`bottom-nav-item ${n.id === 'export' ? (exportOpen ? 'active' : '') : activeNav === n.id ? 'active' : ''}`}
            onClick={() => goNav(n)}>
            <span className="mat-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
    </div>
  )
}

// ── ProjectDetail route wrapper ────────────────────
function ProjectDetailRoute() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [project, setProject] = useState(location.state?.project || null)
  const [loading, setLoading] = useState(!location.state?.project)

  useEffect(() => {
    if (!project) {
      setLoading(true)
      getProjects().then(projects => {
        const found = projects.find(p => p.id === id)
        if (found) setProject(found)
        else navigate('/projects')
      }).finally(() => setLoading(false))
    }
  }, [id])

  if (loading) return (
    <div className="screen-content">
      <div style={{padding:32,textAlign:'center',color:'var(--text-muted)'}}>
        <span className="mat-icon spin" style={{fontSize:32}}>refresh</span>
      </div>
    </div>
  )

  return (
    <ProjectDetail
      project={project}
      onBack={() => navigate('/projects')}
      onProjectUpdated={() => {
        getProjects().then(projects => {
          const found = projects.find(p => p.id === id)
          if (found) setProject(found)
        })
      }}
    />
  )
}

// ── Root with BrowserRouter ────────────────────────
export default function App() {
  return (
    <BrowserRouter basename="/leader_pro">
      <AppInner />
    </BrowserRouter>
  )
}
