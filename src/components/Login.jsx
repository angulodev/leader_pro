import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [mode,     setMode]     = useState('login') // 'login' | 'register'

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('✅ Revisa tu email para confirmar tu cuenta.')
        setLoading(false); return
      }
    } catch(e) {
      setError(e.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos.'
        : e.message)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/leader_pro/` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <span className="mat-icon">hub</span>
          </div>
          <div>
            <div className="login-brand-name">Area Leader Pro</div>
            <div className="login-brand-sub">Plataforma de gestión de proyectos</div>
          </div>
        </div>

        <h1 className="login-title">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>

        {/* Google */}
        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.5 5C9.5 40.2 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.7 5.8l6.2 5.2C40.7 35.3 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="login-divider"><span>o</span></div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} />
          </div>
          {error && (
            <div className={`login-msg ${error.startsWith('✅') ? 'login-msg-ok' : 'login-msg-err'}`}>
              {error}
            </div>
          )}
          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading
              ? <><span className="mat-icon spin">refresh</span> Cargando…</>
              : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="login-toggle">
          {mode === 'login' ? (
            <>¿No tienes cuenta? <button onClick={() => { setMode('register'); setError('') }}>Regístrate</button></>
          ) : (
            <>¿Ya tienes cuenta? <button onClick={() => { setMode('login'); setError('') }}>Inicia sesión</button></>
          )}
        </div>

        <div className="login-demo">
          <span>Demo:</span>
          <button onClick={() => { setEmail('admin@admin.cl'); setPassword('admin1234') }}>
            admin@admin.cl / admin1234
          </button>
        </div>
      </div>
    </div>
  )
}
