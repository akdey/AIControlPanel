import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Lock,
  User,
  Cpu,
  KeyRound,
  ArrowRight,
  Fingerprint,
  CheckCircle2,
  Layers,
  Zap,
  Gauge,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './LoginView.css';

export const LoginView: React.FC = () => {
  const [authMode, setAuthMode] = useState<'credentials' | 'sso'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { login, status, errorMessage } = useAuthStore();

  useEffect(() => {
    usernameRef.current?.focus();
  }, [authMode]);

  const handlePersonaClick = (user: string, role: string) => {
    setActivePersona(role);
    setUsername(user);
    setPassword('Admin@123');
    passwordRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await login(username.trim(), password);
  };

  const isLoading = status === 'loading';

  return (
    <div className="auth-viewport">
      {/* LEFT: Platform Architecture & Enterprise Capability Overview */}
      <div className="auth-showcase">
        {/* Top bar */}
        <div className="showcase-header">
          <div className="showcase-brand">
            <div className="showcase-logo-box">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="showcase-brand-title">AI Control Panel</span>
              <span className="showcase-brand-tag">ENTERPRISE CONTROL PLANE</span>
            </div>
          </div>

          <div className="showcase-status-badge">
            <span className="status-ping" />
            <span>OPERATIONAL &middot; v1.0</span>
          </div>
        </div>

        {/* Center narrative visual */}
        <div className="showcase-hero">
          <div className="showcase-kicker">Unified Agent Governance</div>
          <h2 className="showcase-title">
            Enterprise Security, FinOps &amp; Compliance for AI Workflows
          </h2>
          <p className="showcase-desc">
            Centralized policy enforcement engine for multi-agent architectures.
            Inspect, sanitize, route, and audit LLM prompts in real-time across your organization.
          </p>

          {/* Feature Architecture Highlights */}
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-blue">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="feature-card-title">Fail-Closed Guardrails</h4>
                <p className="feature-card-desc">
                  Presidio PII redaction, DeBERTa injection defense, and Yelp secret scanning.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-purple">
                <Gauge className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="feature-card-title">FinOps Unit Economics</h4>
                <p className="feature-card-desc">
                  Sliding window rate limiters, token budget policies, and dynamic model routing.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap feature-icon-emerald">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="feature-card-title">Visual Pipeline Studio</h4>
                <p className="feature-card-desc">
                  DAG-based control orchestrator with drag-and-drop node graph execution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="showcase-footer">
          <span>Enterprise Architecture &middot; Multi-Tenant Workspace &middot; RBAC Enforced</span>
        </div>
      </div>

      {/* RIGHT: Production Auth Console */}
      <div className="auth-console">
        <div className="auth-console-inner">
          {/* Header */}
          <div className="auth-form-header">
            <div className="auth-header-pill">OPERATOR CONSOLE</div>
            <h1 className="auth-form-title">Sign In</h1>
            <p className="auth-form-desc">
              Enter your operator credentials to access the control plane.
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="auth-mode-switch">
            <button
              type="button"
              onClick={() => setAuthMode('credentials')}
              className={`mode-btn ${authMode === 'credentials' ? 'mode-btn-active' : ''}`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('sso')}
              className={`mode-btn ${authMode === 'sso' ? 'mode-btn-active' : ''}`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Enterprise SSO</span>
            </button>
          </div>

          {authMode === 'credentials' ? (
            <>
              {/* Quick Persona Selector */}
              <div className="persona-section">
                <span className="persona-label">PRE-CONFIGURED DEMO ACCOUNTS</span>
                <div className="persona-chips">
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('admin', 'Super Admin')}
                    className={`persona-chip ${activePersona === 'Super Admin' ? 'persona-chip-active' : ''}`}
                  >
                    <User className="w-3 h-3 text-blue-400" />
                    <span>Super Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('secops_user', 'SecOps Admin')}
                    className={`persona-chip ${activePersona === 'SecOps Admin' ? 'persona-chip-active' : ''}`}
                  >
                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                    <span>SecOps Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('dev_user', 'Developer')}
                    className={`persona-chip ${activePersona === 'Developer' ? 'persona-chip-active' : ''}`}
                  >
                    <Cpu className="w-3 h-3 text-emerald-400" />
                    <span>Developer</span>
                  </button>
                </div>
              </div>

              {/* Notification Banner (Errors or Inactivity Logout) */}
              {status === 'error' && errorMessage && (
                <div className="auth-error-card">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="auth-error-content">
                    <span className="auth-error-title">
                      {errorMessage.toLowerCase().includes('inactivity') || errorMessage.toLowerCase().includes('expired')
                        ? 'Session Terminated'
                        : 'Authentication Failed'}
                    </span>
                    <span className="auth-error-desc">{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="auth-username" className="form-label">
                    Operator Username
                  </label>
                  <div className="form-input-wrap">
                    <User className="form-icon" />
                    <input
                      ref={usernameRef}
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="form-input"
                      autoComplete="username"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="form-label">
                      Password
                    </label>
                    <span className="form-hint">Default: Admin@123</span>
                  </div>
                  <div className="form-input-wrap">
                    <Lock className="form-icon" />
                    <input
                      ref={passwordRef}
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="form-input form-input-password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="password-toggle"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className="auth-submit-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="sso-container">
              <div className="sso-box">
                <Fingerprint className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="sso-title">Single Sign-On (SAML / OIDC)</h3>
                <p className="sso-desc">
                  Authenticate via Okta, Azure Active Directory, or Google Workspace.
                </p>
                <button
                  type="button"
                  onClick={() => handlePersonaClick('admin', 'Super Admin')}
                  className="sso-btn"
                >
                  <span>Continue with Corporate SSO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Compliance & Security Badges */}
          <div className="auth-compliance-footer">
            <div className="compliance-badge">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>SOC2 Type II</span>
            </div>
            <div className="compliance-dot" />
            <div className="compliance-badge">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="compliance-dot" />
            <div className="compliance-badge">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>AES-256 GCM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
