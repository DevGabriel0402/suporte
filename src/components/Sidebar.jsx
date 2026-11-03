import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, DoorOpen, FileBarChart, ShieldCheck, Headset, X } from 'lucide-react';

const links = [
  ['/', 'Visão geral', LayoutDashboard],
  ['/checklist', 'Checklist', ClipboardList],
  ['/salas', 'Salas e locais', DoorOpen],
  ['/relatorios', 'Relatórios', FileBarChart],
];

export default function Sidebar({ open, onClose, master }) {
  const items = master ? [...links, ['/master', 'Painel master', ShieldCheck]] : links;
  return <>
    <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
    <aside id="workspace-sidebar" className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Headset size={22} /></div>
        <div className="brand-text"><strong>Conecta<span>TI</span></strong><small>GESTÃO ESCOLAR</small></div>
        <button type="button" className="icon-btn mobile-close" aria-label="Fechar menu" onClick={onClose}><X /></button>
      </div>
      <div className="nav-label">ESPAÇO DE TRABALHO</div>
      <nav aria-label="Navegação principal">
        {items.map(([to, label, Icon]) => <NavLink key={to} to={to} end onClick={onClose}
          aria-label={label} title={label} className="nav-link">
          <Icon size={20} /><span>{label}</span>
        </NavLink>)}
      </nav>
    </aside>
  </>;
}
