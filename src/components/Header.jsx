import { Menu, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const titles = {
  "/apoio": "Apoio à escola",
  "/": "Visão geral",
  "/checklist": "Checklist de atendimento",
  "/salas": "Salas e locais",
  "/relatorios": "Relatórios",
  "/master": "Painel master",
};

export default function Header({ onMenu, open, masterPage, tools, account, schoolName }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const schoolInitials = (schoolName || "").trim().split(/\s+/).filter(Boolean)
    .map(word => Array.from(word)[0]).join("").toLocaleUpperCase("pt-BR");
  return (
    <header className="topbar">
      {tools}
      <button
        type="button"
        className="icon-btn menu-toggle"
        onClick={onMenu}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="workspace-sidebar"
      >
        <Menu />
      </button>
      <div className="breadcrumb">
        <span>ConectaTI</span>
        <b>/</b>
        <strong>{titles[pathname] || "Gestão"}</strong>
      </div>
      <div className="top-actions">
        {schoolInitials && <span className="school-initials" title={schoolName} aria-label={`Escola: ${schoolName}`}>
          {schoolInitials}
        </span>}
        {!masterPage && (
          <button
            type="button"
            className="btn btn-primary top-add"
            aria-label="Novo registro"
            onClick={() => navigate("/checklist?novo=1")}
          >
            <Plus size={17} /> Novo registro
          </button>
        )}
        {account}
      </div>
    </header>
  );
}
