import { useEffect, useRef, useState } from "react";
import { X, Save } from "lucide-react";
const blank = {
  room: "",
  date: new Date().toISOString().slice(0, 10),
  category: "Suporte",
  description: "",
  materials: "",
  status: "Pendente",
  requested: false,
  priority: "Média",
  notes: "",
};
export default function TaskModal({ open, onClose, onSave, onDraft, rooms, task }) {
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const drawer = useRef(null);
  const initialRoom = useRef(rooms[0] || "");
  initialRoom.current = rooms[0] || "";

  useEffect(() => {
    if (!open) return;
    setForm(task ? { ...task } : { ...blank, room: initialRoom.current });
    const dialog = drawer.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open, task]);

  if (!open) return null;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (e.nativeEvent.submitter?.value === "draft" || (!navigator.onLine && onDraft))
      onDraft?.(form);
    else {
      setSaving(true);
      try {
        await onSave(form);
      } finally {
        setSaving(false);
      }
    }
  };
  return (
    <dialog
      ref={drawer}
      className="task-drawer"
      aria-labelledby="task-drawer-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (!saving && event.target === drawer.current) onClose();
      }}
    >
      <section className="task-drawer-content">
        <div className="modal-head">
          <div>
            <span className="eyebrow">REGISTRO DE ATENDIMENTO</span>
            <h2 id="task-drawer-title">
              {task ? "Chamado " + task.id : "Novo registro"}
            </h2>
            <p>
              {task
                ? task.room + " · " + task.status
                : "Preencha os detalhes da necessidade identificada."}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Fechar ficha"
            disabled={saving}
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Sala / Local *
              <select
                required
                value={form.room}
                onChange={(e) => set("room", e.target.value)}
              >
                <option value="">Selecione um local</option>
                {rooms.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Data do levantamento *
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </label>
            <label>
              Categoria *
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {[
                  "Suporte",
                  "Infraestrutura",
                  "Material",
                  "Rede e internet",
                  "Software",
                  "Manutenção",
                  "Outro",
                ].map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Prioridade
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                {["Baixa", "Média", "Alta", "Urgente"].map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            <label className="full">
              O que precisa ser feito? *
              <textarea
                required
                rows="3"
                placeholder="Descreva o problema ou serviço necessário..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <label className="full">
              Materiais necessários
              <textarea
                rows="2"
                placeholder="Ex.: 1 teclado USB, 10 m de cabo de rede..."
                value={form.materials}
                onChange={(e) => set("materials", e.target.value)}
              />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                {[
                  "Pendente",
                  "Em andamento",
                  "Aguardando aprovação",
                  "Concluído",
                  "Cancelado",
                ].map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Solicitação à direção
              <select
                value={form.requested ? "sim" : "nao"}
                onChange={(e) => {
                  set("requested", e.target.value === "sim");
                  if (e.target.value === "sim" && form.status === "Pendente")
                    set("status", "Aguardando aprovação");
                }}
              >
                <option value="nao">Não solicitado</option>
                <option value="sim">Solicitado à direção</option>
              </select>
            </label>
            <label className="full">
              Observações
              <textarea
                rows="2"
                placeholder="Número de protocolo, retorno da direção, detalhes adicionais..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
          </div>
          <div className="modal-footer">
            <span className="required-note">* Campos obrigatórios</span>
            <div>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={onClose}
              >
                Cancelar
              </button>
              {onDraft && (
                <button
                  className="btn btn-outline"
                  type="submit"
                  value="draft"
                  disabled={saving}
                >
                  Salvar rascunho
                </button>
              )}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Save size={16} /> {saving ? "Salvando…" : "Salvar registro"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </dialog>
  );
}
