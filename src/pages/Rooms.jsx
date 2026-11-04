import DeleteConfirmation from '../components/DeleteConfirmation';
import Loading from '../components/Loading';
import { useState, useRef } from "react";
import { GripVertical, DoorOpen, Plus, Trash2, ClipboardList, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRoom({ room, disabled, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: room, disabled });
  return (
    <article ref={setNodeRef} className={`room-card${!disabled ? " room-card-sortable" : ""}${isDragging ? " room-card-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}>
      {children}
      {!disabled && <button ref={setActivatorNodeRef} type="button" className="room-drag-handle"
        {...attributes} {...listeners} aria-label={`Mover ambiente ${room}`} title="Arraste para reorganizar">
        <GripVertical size={20} />
      </button>}
    </article>
  );
}

export default function Rooms() {
  const { rooms, setRooms, tasks, canManage, importLegacyRooms } = useApp(),
    [name, setName] = useState(""),
    [importing, setImporting] = useState(false),
    nav = useNavigate();
  const [savingOrder, setSavingOrder] = useState(false);
  const savingOrderRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  async function reorderRooms({ active, over }) {
    if (!canManage || savingOrderRef.current || !over || active.id === over.id) return;
    savingOrderRef.current = true;
    setSavingOrder(true);
    try {
      const saved = await setRooms(current => {
        const from = current.indexOf(active.id);
        const to = current.indexOf(over.id);
        return from < 0 || to < 0 ? current : arrayMove(current, from, to);
      });
      if (saved) toast.success("Ordem dos ambientes salva!");
    } finally {
      savingOrderRef.current = false;
      setSavingOrder(false);
    }
  }
  const [pendingDelete, setPendingDelete] = useState(null);
  const add = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (rooms.some((r) => r.toLowerCase() === n.toLowerCase()))
      return toast.error("Este ambiente já está cadastrado.");
    if (
      !(await setRooms((p) =>
        p.some((r) => r.toLowerCase() === n.toLowerCase()) ? p : [...p, n],
      ))
    )
      return;
    setName("");
    toast.success("Ambiente adicionado!");
  };
  async function remove(room) {
    const removed = await setRooms((current, currentTasks) => {
      if (currentTasks.some(task => task.room === room)) throw new Error("room-in-use");
      return current.filter(item => item !== room);
    });
    if (removed) toast.success("Ambiente removido.");
    return removed;
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ORGANIZAÇÃO DOS ESPAÇOS</span>
          <h1>Salas e locais</h1>
          <p>Cadastre os ambientes para vincular as necessidades de suporte.</p>
        </div>
        {importLegacyRooms && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={importing}
            onClick={async () => {
              setImporting(true);
              try {
                await importLegacyRooms();
              } finally {
                setImporting(false);
              }
            }}
          >
            {importing ? <Loading label="Importando…" inline /> : "Importar meus ambientes"}
          </button>
        )}
      </div>
      {canManage && (
        <section className="panel room-form-panel">
          <div className="room-form-icon">
            <DoorOpen />
          </div>
          <div className="room-form-copy">
            <h2>Adicionar ambiente</h2>
            <p>Inclua salas, setores e espaços físicos da escola.</p>
          </div>
          <form onSubmit={add}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Laboratório de Ciências"
            />
            <button className="btn btn-primary">
              <Plus size={17} /> Adicionar
            </button>
          </form>
        </section>
      )}
      <div className="rooms-heading">
        <div>
          <h2>Ambientes cadastrados</h2>
          <p>{rooms.length} locais disponíveis para registro</p>
          {canManage && <p className="room-order-hint" role="status">{savingOrder ? "Salvando ordem…" : "Arraste pelo ícone de pontos para reorganizar. No teclado, use espaço, setas e espaço para confirmar."}</p>}
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderRooms}
        accessibility={{ screenReaderInstructions: { draggable: "Para mover um ambiente, pressione espaço. Use as setas para escolher a posição e espaço para confirmar. Escape cancela." } }}>
      <SortableContext items={rooms} strategy={rectSortingStrategy}>
      <div className="rooms-grid">
        {rooms.map((r, i) => {
          const count = tasks.filter((t) => t.room === r).length;
          return (
            <SortableRoom key={r} room={r} disabled={!canManage || savingOrder}>
              <div className="room-card-top">
                <div className="room-card-icon">
                  <DoorOpen size={19} />
                </div>
                {canManage && (
                  <button
                    className="row-actions trash-btn"
                    onClick={() => setPendingDelete(r)}
                    title="Remover ambiente"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <h3>{r}</h3>
              <div className="room-card-bottom">
                <span>
                  <ClipboardList size={14} />
                  {count} {count === 1 ? "registro" : "registros"}
                </span>
                <button onClick={() => nav(`/checklist?local=${encodeURIComponent(r)}`)}>
                  Ver registros <ArrowRight size={14} />
                </button>
              </div>
            </SortableRoom>
          );
        })}
      </div>
      </SortableContext>
      </DndContext>
      {pendingDelete !== null && <DeleteConfirmation target={pendingDelete}
        onClose={() => setPendingDelete(null)} onDelete={() => remove(pendingDelete)} />}
    </div>
  );
}

