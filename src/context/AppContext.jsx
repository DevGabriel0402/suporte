import { taskFields, updateWithHistory } from '../utils/taskHistory';
import Loading from '../components/Loading';
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const AppContext = createContext(null);
const empty = { rooms: [], tasks: [] };

export function AppProvider({ children, client, uid, schoolId, canManage, canImport }) {
  const { store, db } = client;
  const scope = schoolId ? "schools" : "users";
  const workspaceId = schoolId ?? uid;
  const ref = store.doc(db, scope, workspaceId, "data", "workspace");

  function readData(snapshot) {
    const data = { ...empty, ...snapshot.data() };
    return schoolId || data.tasksById ? { ...data, tasks: Object.values(data.tasksById ?? {}) } : data;
  }
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(
    () =>
      store.onSnapshot(
        store.doc(db, scope, workspaceId, "data", "workspace"),
        (snapshot) => setData(readData(snapshot)),
        () => setError(true),
      ),
    [store, db, scope, workspaceId, schoolId],
  );

  function writeSummary(transaction, workspace) {
    transaction.set(store.doc(db, 'schoolSummaries', schoolId), {
      rooms: workspace.rooms.length,
      open: workspace.tasks.filter(task => !['Concluído', 'Cancelado'].includes(task.status)).length,
    });
  }

  async function syncSummary() {
    try {
      await store.runTransaction(db, async transaction => {
        writeSummary(transaction, readData(await transaction.get(ref)));
      });
      toast.success('Indicadores atualizados.');
    } catch {
      toast.error('Não foi possível atualizar os indicadores.');
    }
  }

  async function change(field, update) {
    if (!schoolId && !data?.tasksById && data?.tasks?.length) {
      try {
        await store.runTransaction(db, async transaction => {
          const snapshot = await transaction.get(ref);
          const legacy = snapshot.data();
          if (legacy?.tasksById || !legacy?.tasks?.length) return;
          transaction.set(ref, { rooms: legacy.rooms || [], tasksById: Object.fromEntries(legacy.tasks.map(task => [task.id, task])), mutationTaskId: "" });
        });
      } catch {
        toast.error("Não foi possível atualizar o espaço individual. Verifique as permissões.");
        return false;
      }
    }
    return store
      .runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = readData(snapshot);
        const next =
          typeof update === "function" ? update(current[field], current) : update;
        const merged = { ...current, [field]: next };
        const previousTasks = Object.fromEntries(current.tasks.map(task => [task.id, task]));
        const changed = merged.tasks.find(task => task !== previousTasks[task.id]);
        const removed = current.tasks.find(task => !merged.tasks.some(nextTask => nextTask.id === task.id));
        if (schoolId) writeSummary(transaction, merged);
        transaction.set(ref, {
          rooms: merged.rooms,
          tasksById: Object.fromEntries(merged.tasks.map(task => [task.id, task])),
          mutationTaskId: changed?.id || removed?.id || "",
        });
      })
      .then(() => true)
      .catch((error) => {
        toast.error(
          error.message === "room-in-use"
            ? "Existem registros vinculados a este ambiente."
            : "Não foi possível salvar. Verifique a conexão e as permissões.",
        );
        return false;
      });
  }

  async function importLegacyRooms() {
    try {
      const personal = await store.getDocFromServer(
        store.doc(db, "users", uid, "data", "workspace"),
      );
      const previous = personal.data()?.rooms ?? [];
      if (!previous.length) {
        toast("Nenhum ambiente encontrado no espaço individual.");
        return;
      }
      const saved = await change("rooms", (rooms) => {
        const byName = new Map(rooms.map((room) => [room.trim().toLowerCase(), room]));
        for (const room of previous) {
          const key = room.trim().toLowerCase();
          if (key && !byName.has(key)) byName.set(key, room);
        }
        return [...byName.values()];
      });
      if (saved) toast.success("Ambientes sincronizados com a escola.");
    } catch {
      toast.error("Não foi possível consultar os ambientes do espaço individual.");
    }
  }

  if (error || !data)
    return (
      <main className="login-screen">
        <p role={error ? "alert" : "status"}>
          {error
            ? "Não foi possível carregar os dados do Firestore."
            : <Loading label="Carregando dados…" inline />}
        </p>
      </main>
    );

  const actor = { uid, name: client.auth.currentUser?.displayName || client.auth.currentUser?.email || "Usuário" };
  const value = {
    ...data,
    canManage,
    syncSummary: schoolId && canManage ? syncSummary : undefined,
    draftKey: JSON.stringify(["cti-draft", uid, scope, workspaceId]),
    importLegacyRooms: canImport && schoolId ? importLegacyRooms : undefined,
    setRooms: (update) =>
      change("rooms", (rooms, current) => update(rooms, current.tasks)),

    addTask: (task, id = "OS-" + crypto.randomUUID().slice(0, 8)) => {
      const fields = Object.fromEntries(Object.keys(taskFields).map(key => [key, task[key] ?? (key === "requested" ? false : "")]));
      const entry = { ...fields, id, history: [{ id: crypto.randomUUID(), action: "created", actor, at: new Date().toISOString(), changes: [] }] };
      return change("tasks", tasks => tasks.some(item => item.id === id) ? tasks : [entry, ...tasks]);
    },
    updateTask: (task, original) => {
      const at = new Date().toISOString();
      const eventId = crypto.randomUUID();
      return change("tasks", tasks => {
        if (!tasks.some(item => item.id === task.id)) throw new Error("task-not-found");
        return tasks.map(item => item.id === task.id ? updateWithHistory(item, task, original, actor, at, eventId) : item);
      });
    },
    deleteTask: (id) =>
      change("tasks", (tasks) => tasks.filter((task) => task.id !== id)),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
