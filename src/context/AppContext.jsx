import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const AppContext = createContext(null);
const empty = { rooms: [], tasks: [] };

export function AppProvider({ children, client, uid }) {
  const { store, db } = client;
  const ref = store.doc(db, 'users', uid, 'data', 'workspace');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => store.onSnapshot(store.doc(db, 'users', uid, 'data', 'workspace'),
    snapshot => setData({ ...empty, ...snapshot.data() }),
    () => setError(true)), [store, db, uid]);

  function change(field, update) {
    return store.runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      const current = { ...empty, ...snapshot.data() };
      transaction.set(ref, { [field]: typeof update === 'function' ? update(current[field]) : update }, { merge: true });
    }).catch(() => toast.error('Não foi possível salvar. Verifique a conexão e tente novamente.'));
  }

  if (error || !data) return <main className="login-screen">
    <p role={error ? 'alert' : 'status'}>{error ? 'Não foi possível carregar os dados do Firestore.' : 'Carregando dados…'}</p>
  </main>;

  const value = {
    ...data,
    setRooms: update => change('rooms', update),
    setTasks: update => change('tasks', update),
    addTask: task => {
      const id = 'OS-' + crypto.randomUUID().slice(0, 8);
      return change('tasks', tasks => [{ ...task, id }, ...tasks]);
    },
    updateTask: task => change('tasks', tasks => tasks.map(item => item.id === task.id ? task : item)),
    deleteTask: id => change('tasks', tasks => tasks.filter(task => task.id !== id)),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);

