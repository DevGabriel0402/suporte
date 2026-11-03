import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Send,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Wrench,
  Package,
  Network,
  Monitor,
  CalendarDays,
  DoorOpen,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
const icons = {
  Suporte: Monitor,
  Infraestrutura: Wrench,
  Material: Package,
  "Rede e internet": Network,
  Software: Monitor,
  Manutenção: Wrench,
  Outro: ClipboardList,
};
export default function Dashboard() {
  const { tasks, rooms } = useApp(),
    nav = useNavigate();
  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) =>
        ["Pendente", "Aguardando aprovação"].includes(t.status),
      ).length,
      progress: tasks.filter((t) => t.status === "Em andamento").length,
      done: tasks.filter((t) => t.status === "Concluído").length,
      requested: tasks.filter((t) => t.requested).length,
    }),
    [tasks],
  );
  const recent = tasks.slice(0, 5);
  const categories = Object.keys(icons)
    .map((name) => ({ name, count: tasks.filter((t) => t.category === name).length }))
    .filter((x) => x.count)
    .sort((a, b) => b.count - a.count);
  return (
    <div className="page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">PAINEL DE CONTROLE</span>
          <h1>
            Bom dia! <span className="wave">✦</span>
          </h1>
          <p>Acompanhe as necessidades e os atendimentos de TI da escola.</p>
        </div>
        <button className="btn btn-primary" onClick={() => nav("/checklist?novo=1")}>
          <Plus size={17} /> Adicionar necessidade
        </button>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total de registros"
          value={stats.total}
          caption="Demandas cadastradas"
          icon={ClipboardList}
        />
        <StatCard
          label="Aguardando"
          onClick={() => nav("/checklist?status=" + encodeURIComponent("Aguardando"))}
          value={stats.pending}
          caption="Precisam de atenção"
          icon={Clock3}
          tone="orange"
        />
        <StatCard
          label="Em andamento"
          onClick={() => nav("/checklist?status=" + encodeURIComponent("Em andamento"))}
          value={stats.progress}
          caption="Atendimentos ativos"
          icon={Wrench}
          tone="purple"
        />
        <StatCard
          label="Concluídos"
          onClick={() => nav("/checklist?status=" + encodeURIComponent("Concluído"))}
          value={stats.done}
          caption="Serviços finalizados"
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Registros recentes</h2>
              <p>Últimas necessidades adicionadas ao checklist</p>
            </div>
            <button className="text-action" onClick={() => nav("/checklist")}>
              Ver todos <ArrowUpRight size={15} />
            </button>
          </div>
          {recent.length ? (
            <div className="task-list">
              {recent.map((t) => {
                const Icon = icons[t.category] || ClipboardList;
                return (
                  <div className="recent-item" key={t.id}>
                    <div className="task-type-icon">
                      <Icon size={18} />
                    </div>
                    <div className="recent-main">
                      <strong>{t.description}</strong>
                      <span>
                        <b>{t.room}</b>
                        <i>·</i>
                        {t.category}
                        <i>·</i>
                        {new Date(`${t.date}T12:00:00`).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <StatusBadge status={t.status} />
                    <button className="row-arrow" onClick={() => nav("/checklist")}>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <ClipboardList />
              <strong>Nenhum registro por aqui</strong>
              <span>Comece adicionando uma necessidade da escola.</span>
            </div>
          )}
          <div className="panel-foot">
            <span>
              Exibindo {recent.length} de {tasks.length} registros
            </span>
            <button onClick={() => nav("/checklist")}>
              Acessar checklist <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <aside className="side-stack">
          <section className="panel room-panel">
            <div className="panel-heading">
              <div>
                <h2>Visão por categoria</h2>
                <p>Distribuição das demandas</p>
              </div>
            </div>
            {categories.length ? (
              categories.slice(0, 5).map((c) => (
                <div className="category-row" key={c.name}>
                  <div className="category-top">
                    <span>{c.name}</span>
                    <strong>{c.count}</strong>
                  </div>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${stats.total ? (c.count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-empty">As categorias aparecerão aqui.</p>
            )}
          </section>
          <section className="request-card">
            <div className="request-top">
              <div className="request-icon">
                <Send size={18} />
              </div>
              <span>GESTÃO DE SOLICITAÇÕES</span>
            </div>
            <strong>
              {stats.requested} <small>solicitações</small>
            </strong>
            <p>Registros marcados como encaminhados à direção.</p>
            <button onClick={() => nav("/checklist?direcao=sim")}>
              Ver solicitações <ArrowRight size={15} />
            </button>
          </section>
          <section className="mini-info">
            <div className="mini-icon">
              <DoorOpen size={19} />
            </div>
            <div>
              <strong>{rooms.length} ambientes cadastrados</strong>
              <span>Locais monitorados pela equipe</span>
            </div>
            <button onClick={() => nav("/salas")}>
              <ArrowRight size={16} />
            </button>
          </section>
        </aside>
      </div>
      <div className="dashboard-bottom">
        <div>
          <CalendarDays size={17} />
          <span>Atualizado em {new Date().toLocaleDateString("pt-BR")}</span>
        </div>
        <span>
          ConectaTI <b>·</b> Gestão de suporte escolar
        </span>
      </div>
    </div>
  );
}
