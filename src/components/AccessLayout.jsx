import { ClipboardCheck, Eye, EyeOff, Headset } from 'lucide-react';
import { useState } from 'react';

export default function AccessLayout({ title, description, children, footer }) {
  return <main className="access-layout">
    <aside className="access-brand">
      <div className="access-logo"><span><Headset size={22} /></span> ConectaTI</div>
      <div className="access-intro">
        <span className="access-kicker">GESTÃO DE TI ESCOLAR</span>
        <p>O suporte da sua escola em um só lugar.</p>
        <div><ClipboardCheck size={21} /> Acompanhe chamados, salas e relatórios.</div>
      </div>
      <small>ConectaTI · Portal de suporte escolar</small>
    </aside>
    <section className="access-content" aria-labelledby="access-title">
      <div className="access-card">
        <h1 id="access-title">{title}</h1>
        <p className="access-description">{description}</p>
        {children}
        {footer && <div className="access-footer">{footer}</div>}
      </div>
    </section>
  </main>;
}

export function PasswordField({ newPassword = false }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ocultar senha' : 'Mostrar senha';
  return <div className="access-field">
    <label htmlFor="access-password">Senha</label>
    <div className="access-password">
      <input id="access-password" name="password" type={visible ? 'text' : 'password'}
        autoComplete={newPassword ? 'new-password' : 'current-password'}
        minLength={newPassword ? 6 : undefined} aria-describedby={newPassword ? 'password-hint' : undefined} required />
      <button type="button" aria-label={label} title={label} onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
    {newPassword && <small id="password-hint">Use pelo menos 6 caracteres.</small>}
  </div>;
}
