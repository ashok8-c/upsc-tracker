import { useState } from 'react'
import { signIn, signUp } from '../lib/auth'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) return setError('Please fill in all fields')
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0c0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      <div style={{
        background: '#111418', border: '1px solid #1e2430', borderRadius: 16,
        padding: 40, width: '100%', maxWidth: 400
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#e8c14a', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>UPSC</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e8ecf0', marginTop: 4 }}>Study Tracker</div>
          <div style={{ fontSize: 13, color: '#5a6070', marginTop: 6 }}>
            {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6070', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</div>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', background: '#181c22', border: '1px solid #252d3a',
                borderRadius: 8, color: '#e8ecf0', fontSize: 14, padding: '10px 14px',
                fontFamily: 'Syne, sans-serif', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6070', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Password</div>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', background: '#181c22', border: '1px solid #252d3a',
                borderRadius: 8, color: '#e8ecf0', fontSize: 14, padding: '10px 14px',
                fontFamily: 'Syne, sans-serif', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error / Message */}
          {error && (
            <div style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff5c5c' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: 'rgba(61,220,132,0.1)', border: '1px solid rgba(61,220,132,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#3ddc84' }}>
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: '#e8c14a', color: '#0a0c0f', border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif', marginTop: 4, opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle */}
          <div style={{ textAlign: 'center', fontSize: 13, color: '#5a6070', marginTop: 4 }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
              style={{ color: '#e8c14a', cursor: 'pointer', fontWeight: 700 }}
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}