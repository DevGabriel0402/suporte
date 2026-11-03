import { useState } from 'react';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function WorkspaceShell({ children, master, email, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('cti_sidebar') === 'collapsed');
  const { pathname } = useLocation();
  const masterPage = pathname.replace(/\/$/, '') === '/master';

  function toggle() {
    const next = !collapsed;
    localStorage.setItem('cti_sidebar', next ? 'collapsed' : 'expanded');
    setCollapsed(next);
  }

  const label = collapsed ? 'Expandir menu' : 'Recolher menu';
  return <div className={`app-shell ${collapsed ? 'shell-collapsed' : ''}`}>
    <Sidebar open={open} onClose={() => setOpen(false)} master={master} />
    <div className="main-shell">
      <Header onMenu={() => setOpen(true)} open={open} masterPage={masterPage} tools={<>
        <button type="button" className="icon-btn desktop-toggle" onClick={toggle}
          title={label} aria-label={label} aria-expanded={!collapsed} aria-controls="workspace-sidebar">
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </>} account={<button type="button" className="btn btn-outline account-exit" onClick={onSignOut}
        title={email}><LogOut size={16} /> Sair</button>} />
      <main>{children}</main>
      <footer className="app-footer">ConectaTI <span>·</span> Gestão de suporte escolar</footer>
    </div>
  </div>;
}
