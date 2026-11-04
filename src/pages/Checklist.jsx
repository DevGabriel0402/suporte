import { isOverdue } from '../utils/taskHistory';
import DeleteConfirmation from "../components/DeleteConfirmation";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  FileSpreadsheet,
  Printer,
  Pencil,
  Trash2,
  Package,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import StatusBadge from "../components/StatusBadge";
import TaskModal from "../components/TaskModal";
import { exportCSV, exportExcel, printReport } from "../utils/export";
export default function Checklist() {
  const { tasks, rooms, addTask, updateTask, deleteTask, canManage, draftKey } = useApp();
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [search, setSearch] = useState(""),
    [room, setRoom] = useState("Todas as salas"),
    [status, setStatus] = useState("Todos os status"),
    [category, setCategory] = useState("Todas as categorias"),
    [period, setPeriod] = useState("");
  useEffect(() => {
    if (params.get("novo")) {
      setEditing(null);
      setModal(true);
      setParams({});
    }
  }, [params, setParams]);
  useEffect(() => {
    if (params.get("direcao") === "sim") setStatus("Solicitado à direção");
    const stage = params.get("status");
    if (stage) setStatus(stage);
    const local = params.get("local");
    if (local) setRoom(local);
  }, [params]);
  const filtered = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            (!onlyOverdue || isOverdue(t)) &&
            (room === "Todas as salas" || t.room === room) &&
            (status === "Todos os status" ||
              (status === "Aguardando" &&
                ["Pendente", "Aguardando aprovação"].includes(t.status)) ||
              (status === "Solicitado à direção" ? t.requested : t.status === status)) &&
            (category === "Todas as categorias" || t.category === category) &&
            (!period || t.date === period) &&
            `${t.description} ${t.room} ${t.id} ${t.materials} ${t.assignee || ""}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [tasks, room, status, category, period, search, onlyOverdue],
  );
  const [draft, setDraft] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(draftKey));
    } catch {
      return null;
    }
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [sendingDraft, setSendingDraft] = useState(false);

  function saveDraft(form) {
    if (draft) {
      setPendingDelete({
        label: "o rascunho anterior para salvar o novo",
        action: () => persistDraft(form),
      });
      return;
    }
    persistDraft(form);
  }

  function persistDraft(form) {
    const next = { id: "OS-" + crypto.randomUUID().slice(0, 8), form };
    try {
      localStorage.setItem(draftKey, JSON.stringify(next));
      setDraft(next);
      setModal(false);
      toast.success("Rascunho salvo neste dispositivo.");
      return true;
    } catch {
      toast.error("Não foi possível salvar o rascunho neste dispositivo.");
      return false;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey);
      setDraft(null);
      return true;
    } catch {
      toast.error("Não foi possível limpar o rascunho deste dispositivo.");
      return false;
    }
  }

  async function sendDraft() {
    if (!navigator.onLine) {
      toast.error("Reconecte-se à internet para enviar o rascunho.");
      return;
    }
    if (!rooms.includes(draft.form.room)) {
      toast.error("O ambiente deste rascunho não está mais disponível.");
      return;
    }
    setSendingDraft(true);
    try {
      if (await addTask(draft.form, draft.id)) {
        clearDraft();
        toast.success("Chamado enviado à escola.");
      }
    } finally {
      setSendingDraft(false);
    }
  }

  const save = async (form) => {
    if (editing) {
      if (!(await updateTask({ ...form, id: editing.id }, editing))) return;
      toast.success("Registro atualizado com sucesso!");
    } else {
      if (!(await addTask(form))) return;
      toast.success("Necessidade cadastrada com sucesso!");
    }
    setModal(false);
    setEditing(null);
  };
  const edit = (t) => {
    setEditing(t);
    setModal(true);
  };
  async function remove(id) {
    const removed = await deleteTask(id);
    if (removed) toast.success("Registro excluído.");
    return removed;
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACOMPANHAMENTO</span>
          <h1>Checklist de atendimento</h1>
          <p>Registre, organize e acompanhe todas as necessidades da escola.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          <Plus size={17} /> Novo registro
        </button>
      </div>
      {draft && (
        <section className="panel draft-notice">
          <div>
            <strong>Rascunho salvo neste dispositivo</strong>
            <p>
              {draft.form.room} · {draft.form.description}
            </p>
          </div>
          <div className="review-actions">
            <button
              className="btn btn-primary"
              disabled={sendingDraft}
              onClick={sendDraft}
            >
              {sendingDraft ? "Enviando…" : "Enviar chamado"}
            </button>
            <button
              className="btn btn-outline"
              disabled={sendingDraft}
              onClick={() =>
                setPendingDelete({
                  label: "o rascunho neste dispositivo",
                  action: clearDraft,
                })
              }
            >
              Descartar
            </button>
          </div>
        </section>
      )}
      <div className="quick-summary">
        <div>
          <span>Total filtrado</span>
          <strong>{filtered.length}</strong>
        </div>
        <div>
          <span>Solicitados à direção</span>
          <strong>{filtered.filter((t) => t.requested).length}</strong>
        </div>
        <div>
          <span>Concluídos</span>
          <strong>{filtered.filter((t) => t.status === "Concluído").length}</strong>
        </div>
        <div className="summary-hint">
          <ClipboardList size={18} />
          <span>Use os filtros para montar um relatório por ambiente.</span>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="filter-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Buscar por descrição, sala ou protocolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filters">
            <button className="btn btn-outline btn-sm" aria-pressed={onlyOverdue} onClick={() => setOnlyOverdue(value => !value)}>
              {onlyOverdue ? "✓ " : ""}Somente atrasados
            </button>
            <select value={room} onChange={(e) => setRoom(e.target.value)}>
              <option>Todas as salas</option>
              {rooms.map((r) => (
                <option>{r}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Todos os status</option>
              <option>Aguardando</option>
              {[
                "Pendente",
                "Em andamento",
                "Aguardando aprovação",
                "Concluído",
                "Cancelado",
                "Solicitado à direção",
              ].map((s) => (
                <option>{s}</option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Todas as categorias</option>
              {[
                "Suporte",
                "Infraestrutura",
                "Material",
                "Rede e internet",
                "Software",
                "Manutenção",
                "Outro",
              ].map((s) => (
                <option>{s}</option>
              ))}
            </select>
            <input
              aria-label="Filtrar por data"
              type="date"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
        </div>
        <div className="active-filters" aria-label="Filtros ativos">
          {[
            search && [search, () => setSearch("")],
            room !== "Todas as salas" && [room, () => setRoom("Todas as salas")],
            status !== "Todos os status" && [status, () => setStatus("Todos os status")],
            category !== "Todas as categorias" && [
              category,
              () => setCategory("Todas as categorias"),
            ],
            period && [period, () => setPeriod("")],
          ]
            .filter(Boolean)
            .map(([label, clear], index) => (
              <button
                className="btn btn-outline btn-sm"
                key={index}
                onClick={clear}
                aria-label={"Remover filtro " + label}
              >
                {label} ×
              </button>
            ))}
        </div>
        <div className="table-actions">
          <span>
            <SlidersHorizontal size={15} /> {filtered.length} registro(s) encontrado(s)
          </span>
          <div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => exportCSV(filtered)}
            >
              <Download size={15} /> CSV
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => exportExcel(filtered)}
            >
              <FileSpreadsheet size={15} /> Excel
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                printReport(
                  filtered,
                  room === "Todas as salas"
                    ? "Relatório geral de suporte de TI"
                    : `Relatório — ${room}`,
                )
              }
            >
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table checklist-table">
            <thead>
              <tr>
                <th>PROTOCOLO / DATA</th>
                <th>SALA / LOCAL</th>
                <th>NECESSIDADE</th>
                <th>CATEGORIA</th>
                <th>STATUS</th>
                <th>DIREÇÃO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <button
                      className="protocol protocol-link"
                      onClick={() => edit(t)}
                      aria-label={"Abrir chamado " + t.id}
                    >
                      {t.id}
                    </button>
                    <span className="cell-muted">
                      {new Date(`${t.date}T12:00:00`).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td>
                    <strong>{t.room}</strong>
                  </td>
                  <td className="description-cell">
                    <strong>{t.description}</strong>
                    {t.materials && (
                      <span>
                        <Package size={12} />
                        {t.materials}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="category-pill">{t.category}</span>
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                    <span className="cell-muted">Responsável: {t.assignee || "Não definido"}</span>
                    {t.dueDate && <span className={isOverdue(t) ? "task-overdue" : "cell-muted"}>
                      {isOverdue(t) ? "Atrasado · " : "Prazo: "}{new Date(t.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                    </span>}
                    {t.priority && (
                      <span className="cell-muted">Prioridade {t.priority}</span>
                    )}
                  </td>
                  <td>
                    <span className={`request-label ${t.requested ? "yes" : ""}`}>
                      {t.requested ? "Solicitado" : "Não solicitado"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        title="Abrir ficha"
                        aria-label={"Abrir ficha " + t.id}
                        onClick={() => edit(t)}
                      >
                        <Pencil size={15} />
                      </button>
                      {canManage && (
                        <button
                          title="Excluir"
                          aria-label={"Excluir chamado " + t.id}
                          onClick={() =>
                            setPendingDelete({
                              label: "o chamado " + t.id,
                              action: () => remove(t.id),
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty-state">
              <Search size={25} />
              <strong>Nenhum registro encontrado</strong>
              <span>Tente ajustar os filtros ou cadastre uma nova necessidade.</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setOnlyOverdue(false);
                  setSearch("");
                  setRoom("Todas as salas");
                  setStatus("Todos os status");
                  setCategory("Todas as categorias");
                  setPeriod("");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>Os dados são sincronizados com o Firestore.</span>
          <span>
            {filtered.length} de {tasks.length} registros
          </span>
        </div>
      </section>
      <TaskModal
        open={modal}
        onClose={() => {
          setModal(false);
          setEditing(null);
        }}
        onSave={save}
        onDraft={editing || sendingDraft ? undefined : saveDraft}
        rooms={rooms}
        task={editing}
      />
      {pendingDelete && (
        <DeleteConfirmation
          target={pendingDelete.label}
          onClose={() => setPendingDelete(null)}
          onDelete={pendingDelete.action}
        />
      )}
    </div>
  );
}
