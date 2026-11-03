import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  ShieldCheck,
  Headset,
  MessageCircle,
  X,
} from "lucide-react";

const links = [
  ["/", "Visão geral", LayoutDashboard],
  ["/checklist", "Checklist", ClipboardList],
  ["/salas", "Salas e locais", DoorOpen],
  ["/relatorios", "Relatórios", FileBarChart],
];

export default function Sidebar({ open, onClose, master, schoolSupport, supportUrl }) {
  const items = [
    ...links,
    ...(schoolSupport ? [["/apoio", "Apoio à escola", Headset]] : []),
    ...(master ? [["/master", "Painel master", ShieldCheck]] : []),
  ];
  return (
    <>
      <div className={`sidebar-backdrop ${open ? "show" : ""}`} onClick={onClose} />
      <aside id="workspace-sidebar" className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Headset size={22} />
          </div>
          <div className="brand-text">
            <strong>
              Conecta<span>TI</span>
            </strong>
            <small>GESTÃO ESCOLAR</small>
          </div>
          <button
            type="button"
            className="icon-btn mobile-close"
            aria-label="Fechar menu"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="nav-label">ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação principal">
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              aria-label={label}
              title={label}
              className="nav-link"
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {supportUrl && (
          <a
            className="nav-link sidebar-support"
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Falar com o suporte pelo WhatsApp"
            aria-label="Falar com o suporte pelo WhatsApp"
            onClick={onClose}
          >
            <MessageCircle size={20} />
            <span>Falar com o suporte</span>
          </a>
        )}
      </aside>
    </>
  );
}
