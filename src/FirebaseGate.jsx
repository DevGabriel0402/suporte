import AccessLayout, { PasswordField } from './components/AccessLayout';
import WorkspaceShell from './components/WorkspaceShell';
import { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import App from './App';
import { Link, useLocation } from 'react-router-dom';

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

async function connect() {
  const base = 'https://www.gstatic.com/firebasejs/11.10.0/firebase-';
  const [core, identity, store] = await Promise.all(
    ['app', 'auth', 'firestore'].map(name => import(/* @vite-ignore */ (base + name + '.js')))
  );
  const app = core.initializeApp(config);
  return { core, identity, auth: identity.getAuth(app), store, db: store.getFirestore(app) };
}

let connection;
export default function FirebaseGate() {
  const { pathname } = useLocation();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const configured = Object.values(config).every(Boolean);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    let unsubscribe;
    connection ??= connect();
    connection.then(client => {
      if (active) unsubscribe = client.identity.onAuthStateChanged(client.auth,
        user => setSession({ client, user }),
        () => setError('Não foi possível verificar a sessão.'));
    }).catch(() => { if (active) setError('Não foi possível carregar o Firebase.'); });
    return () => { active = false; unsubscribe?.(); };
  }, [configured]);

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { identity, auth } = session.client;
    setBusy(true);
    setError('');
    try {
      await identity.signInWithEmailAndPassword(auth, form.get('email'), form.get('password'));
    } catch {
      setError('Não foi possível entrar. Confira seus dados e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  if (session && pathname.replace(/\/$/, "") === "/cadastro") return <Cadastro client={session.client} />;
  if (session?.user) {
    const { client, user } = session;
    const masterPage = pathname.replace(/\/$/, '') === '/master';
    return <WorkspaceAccess key={user.uid} client={client} user={user} onSignOut={() =>
      client.identity.signOut(client.auth).catch(() => setError('Não foi possível sair.'))
    }>
      {masterPage ? <MasterPanel client={client} user={user} /> :
        <AppProvider client={client} uid={user.uid}><App /></AppProvider>}
      {error && <p role="alert">{error}</p>}
    </WorkspaceAccess>;
  }

  return <AccessLayout title="Entre na sua conta" description="Acesse o painel de suporte com seu e-mail e senha."
    footer={session && <>Precisa de acesso? <Link to="/cadastro">Solicitar cadastro</Link></>}>
    {!configured ? <p>Preencha o arquivo .env.local para conectar o Firebase.</p> :
      session ? <form className="access-form" onSubmit={login} aria-busy={busy}>
        <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
        <PasswordField />
        {error && <p className="access-feedback" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form> : error ? <p className="access-feedback" role="alert">{error}</p> :
        <p role="status">Verificando sessão…</p>}
  </AccessLayout>;;
}


function useRole(client, user) {
  const [profile, setProfile] = useState(undefined);
  useEffect(() => client.store.onSnapshot(
    client.store.doc(client.db, 'roles', user.uid),
    snapshot => setProfile(snapshot.data() ?? null),
    () => setProfile(null),
  ), [client, user.uid]);
  return profile;
}

function Cadastro({ client }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function register(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const school = fields.get('school').trim();
    if (!school) { setMessage('Informe o nome da escola.'); return; }
    const { core, identity, store } = client;
    setBusy(true);
    setMessage('');
    let app;
    let account;
    try {
      app = core.initializeApp(config, 'cadastro');
      const auth = identity.initializeAuth(app, { persistence: identity.inMemoryPersistence });
      ({ user: account } = await identity.createUserWithEmailAndPassword(auth,
        fields.get('email'), fields.get('password')));
      const requestDb = store.initializeFirestore(app, {});
      await store.setDoc(store.doc(requestDb, 'requests', account.uid), { role: fields.get('role'), school, email: account.email });
      form.reset();
      setSubmitted(true);
    } catch (error) {
      let cleanupFailed = false;
      if (account) {
        try { await identity.deleteUser(account); } catch { cleanupFailed = true; }
      }
      setMessage(cleanupFailed
        ? 'A conta foi criada sem perfil. Revise o usuário no console do Firebase.'
        : error.code === 'auth/email-already-in-use'
          ? 'Este e-mail já está cadastrado.'
          : 'Não foi possível cadastrar. Confira os dados e as permissões do Firebase.');
    } finally {
      try { if (app) await core.deleteApp(app); }
      finally { setBusy(false); }
    }
  }

  return <AccessLayout title={submitted ? 'Solicitação enviada' : 'Solicite seu acesso'}
    description={submitted ? 'Sua solicitação foi enviada para análise.' : 'Informe sua escola e o perfil de que você precisa.'}
    footer={<>Já tem uma conta? <Link to="/">Voltar ao login</Link></>}>
    {submitted ? <div className="access-confirmation" role="status">
      <strong>Aguardando aprovação</strong>
      <p>Entre com o e-mail e a senha cadastrados para consultar o status. O acesso ao painel é liberado após a aprovação.</p>
      <Link className="btn btn-primary" to="/">Ir para o login</Link>
    </div> : <form className="access-form" onSubmit={register} aria-busy={busy}>
      <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
      <label>Escola<input name="school" autoComplete="organization" maxLength={160} required /></label>
      <label>Perfil solicitado<select name="role" required defaultValue="">
        <option value="" disabled>Selecione o perfil</option>
        <option value="admin">Administrador</option>
        <option value="tecnico">Técnico</option>
      </select></label>
      <PasswordField newPassword />
      <p className="access-note">A equipe responsável precisa aprovar sua solicitação para liberar o acesso.</p>
      {message && <p className="access-feedback" role="alert">{message}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar solicitação'}</button>
    </form>}
  </AccessLayout>;
}

function MasterPanel({ client, user }) {
  const profile = useRole(client, user);
  const [requests, setRequests] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [people, setPeople] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'master') return;
    const { store, db } = client;
    return store.onSnapshot(store.query(store.collection(db, 'roles'), store.where('role', '==', 'admin')),
      snapshot => setPeople(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))),
      () => setFailed(true));
  }, [client, profile?.role]);

  useEffect(() => {
    if (profile?.role !== 'master') return;
    const { store, db } = client;
    return store.onSnapshot(store.collection(db, 'requests'),
      snapshot => setRequests(snapshot.docs.filter(doc => doc.data().status !== 'rejected').map(doc => ({ id: doc.id, ...doc.data() }))),
      () => setReviewError('Não foi possível carregar as solicitações.'));
  }, [client, profile?.role]);

  async function review(id, approved) {
    const { store, db } = client;
    setReviewing(true);
    setReviewError('');
    try {
      const request = store.doc(db, 'requests', id);
      await store.runTransaction(db, async transaction => {
        const snapshot = await transaction.get(request);
        if (!snapshot.exists() || snapshot.data().status === 'rejected') return;
        if (!approved) {
          transaction.update(request, { status: 'rejected' });
          return;
        }
        transaction.set(store.doc(db, 'roles', id), snapshot.data());
        transaction.delete(request);
      });
    } catch {
      setReviewError('Não foi possível atualizar a solicitação.');
    } finally {
      setReviewing(false);
    }
  }

  const schools = new Map();
  for (const person of people ?? []) {
    const school = person.school || 'Sem escola vinculada';
    if (!schools.has(school)) schools.set(school, []);
    schools.get(school).push(person);
  }
  return <div className="page master-page">
    <Link to="/">Voltar ao painel</Link>
    <h1>Painel master</h1>
    {profile === undefined && <p role="status">Verificando acesso…</p>}
    {profile !== undefined && profile?.role !== 'master' && <p role="alert">Acesso restrito à conta master.</p>}
    {profile?.role === 'master' && <>
      <div className="master-metrics">
        <div className="panel master-metric"><span>Solicitações pendentes</span><strong>{requests?.length ?? '—'}</strong></div>
        <div className="panel master-metric"><span>Administradores</span><strong>{people?.length ?? '—'}</strong></div>
        <div className="panel master-metric"><span>Escolas com administrador</span><strong>{people ? schools.size - Number(schools.has('Sem escola vinculada')) : '—'}</strong></div>
      </div>
      <div className="master-columns">
      <section className="panel master-section">
      <h2>Solicitações pendentes</h2>
      {reviewError && <p role="alert">{reviewError}</p>}
      {requests && requests.length === 0 && <p>Nenhuma solicitação pendente.</p>}
      {!requests && !reviewError && <p role="status">Carregando solicitações…</p>}
      {requests?.map(request => <section className="panel master-school" key={request.id}>
        <h3>{request.school}</h3>
        <p>{request.email} · {request.role === 'admin' ? 'Administrador' : 'Técnico'}</p>
        <div className="review-actions">
          <button className="btn btn-primary" disabled={reviewing} onClick={() => review(request.id, true)}>Aprovar</button>
          <button className="btn btn-outline" disabled={reviewing} onClick={() => {
            if (window.confirm('Recusar a solicitação de ' + request.email + '?')) review(request.id, false);
          }}>Recusar</button>
        </div>
      </section>)}
      </section><section className="panel master-section"><h2>Administradores por escola</h2>
      {failed ? <p role="alert">Não foi possível carregar os administradores.</p>
        : people === null ? <p role="status">Carregando administradores…</p>
        : people.length === 0 ? <p>Nenhum administrador cadastrado.</p>
        : [...schools].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([school, admins]) =>
          <section className="panel master-school" key={school}>
            <h2>{school}</h2>
            <ul>{admins.map(admin => <li key={admin.id}>{admin.email || admin.id}</li>)}</ul>
          </section>)}
      </section></div>
    </>}
  </div>;
}




function WorkspaceAccess({ client, user, children, onSignOut }) {
  const profile = useRole(client, user);
  const [rejected, setRejected] = useState(false);
  useEffect(() => {
    if (profile !== null) return;
    const { store, db } = client;
    return store.onSnapshot(store.doc(db, 'requests', user.uid),
      snapshot => setRejected(snapshot.data()?.status === 'rejected'),
      () => setRejected(false));
  }, [client, profile, user.uid]);

  if (['master', 'admin', 'tecnico'].includes(profile?.role)) {
    return <WorkspaceShell master={profile.role === 'master'} email={user.email} onSignOut={onSignOut}>
      {children}
    </WorkspaceShell>;
  }
  return <main className="login-screen"><section className="panel login-card">
    <h1>ConectaTI</h1>
    <p role="status">{profile === undefined ? 'Verificando acesso…' : rejected ? 'Sua solicitação de cadastro foi recusada.' : 'Seu acesso depende da aprovação da conta master.'}</p>
    <button className="btn btn-outline" onClick={onSignOut}>Sair</button>
  </section></main>;
}



