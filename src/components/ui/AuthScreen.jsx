// src/components/ui/AuthScreen.jsx
import { useState } from 'react'

export default function AuthScreen({ 
  login, 
  register, 
  forgotPassword, 
  getErrorMessage,
  isLoading 
}) {
  // 'login' | 'register' | 'forgot'
  const [screen, setScreen] = useState('login')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  // ─── Handlers ──────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    if (!loginEmail || !loginPassword) { setLoginError('Preencha todos os campos'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      await login(loginEmail, loginPassword)
    } catch (err) {
      setLoginError(getErrorMessage(err.code))
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword) { setRegError('Preencha todos os campos'); return }
    if (regPassword.length < 6) { setRegError('Senha deve ter no mínimo 6 caracteres'); return }
    setRegLoading(true)
    setRegError('')
    try {
      await register(regName, regEmail, regPassword)
    } catch (err) {
      setRegError(getErrorMessage(err.code))
    } finally {
      setRegLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!forgotEmail) { setForgotError('Digite seu email'); return }
    setForgotLoading(true)
    setForgotError('')
    try {
      await forgotPassword(forgotEmail)
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(getErrorMessage(err.code))
    } finally {
      setForgotLoading(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-card">

          {/* Header */}
          <div className="auth-header">
            <i className="ti ti-map-2" style={{ fontSize: 40, color: 'var(--accent)' }} />
            <h1>Planejador de Viagem</h1>
            <p>Organize suas viagens na nuvem</p>
          </div>

          {/* ── Login ────────────────────────────────────────────────────── */}
          {screen === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
              <h2>Entrar</h2>

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Senha</label>
                <input
                  type="password"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
              </div>

              {loginError && <div className="auth-error">{loginError}</div>}

              <button className="auth-btn auth-btn-primary" type="submit" disabled={loginLoading || isLoading}>
                <i className="ti ti-login-2" />
                {loginLoading || isLoading ? ' Entrando...' : ' Entrar'}
              </button>

              <div className="auth-forgot">
                <button type="button" className="auth-link" onClick={() => setScreen('forgot')}>
                  Esqueceu a senha?
                </button>
              </div>

              <p className="auth-switch">
                Não tem conta?{' '}
                <button type="button" className="auth-link" onClick={() => setScreen('register')}>
                  Criar conta
                </button>
              </p>
            </form>
          )}

          {/* ── Register ─────────────────────────────────────────────────── */}
          {screen === 'register' && (
            <form className="auth-form" onSubmit={handleRegister}>
              <h2>Criar Conta</h2>

              <div className="auth-field">
                <label>Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                />
              </div>

              {regError && <div className="auth-error">{regError}</div>}

              <button className="auth-btn auth-btn-primary" type="submit" disabled={regLoading || isLoading}>
                <i className="ti ti-user-plus" />
                {regLoading || isLoading ? ' Criando conta...' : ' Registrar'}
              </button>

              <p className="auth-switch">
                Já tem conta?{' '}
                <button type="button" className="auth-link" onClick={() => setScreen('login')}>
                  Fazer login
                </button>
              </p>
            </form>
          )}

          {/* ── Forgot password ───────────────────────────────────────────── */}
          {screen === 'forgot' && (
            <form className="auth-form" onSubmit={handleForgot}>
              <h2>Recuperar Senha</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Digite seu email para receber um link de redefinição de senha.
              </p>

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                />
              </div>

              {forgotError && <div className="auth-error">{forgotError}</div>}

              {forgotSuccess ? (
                <div className="auth-message">
                  <i className="ti ti-mail-check" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
                  <strong>Email enviado!</strong>
                  <p style={{ marginTop: 8 }}>
                    Verifique sua caixa de entrada e a pasta de spam.
                  </p>
                </div>
              ) : (
                <button className="auth-btn auth-btn-primary" type="submit" disabled={forgotLoading}>
                  <i className="ti ti-mail-forward" />
                  {forgotLoading ? ' Enviando...' : ' Enviar link de recuperação'}
                </button>
              )}

              <div className="auth-forgot" style={{ marginTop: 12 }}>
                <button type="button" className="auth-link" onClick={() => setScreen('login')}>
                  ← Voltar para o login
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="auth-footer">
            <span className="auth-badge">🔒 Seus dados seguros na nuvem</span>
            <span className="auth-badge">☁️ Acesse de qualquer dispositivo</span>
          </div>

        </div>
      </div>
    </div>
  )
}