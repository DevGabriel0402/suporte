import SupportContact, { useSupportContact } from './components/SupportContact';
import { whatsappLink, whatsappNumber } from './utils/whatsapp';
import { Toaster } from 'react-hot-toast';
import SchoolSupport from './components/SchoolSupport';
import Loading from './components/Loading';
import AccessLayout, { PasswordField } from "./components/AccessLayout";
import WorkspaceShell from "./components/WorkspaceShell";
import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import App from "./App";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

async function connect() {
  const base = "https://www.gstatic.com/firebasejs/11.10.0/firebase-";
  const [core, identity, store] = await Promise.all(
    ["app", "auth", "firestore"].map(
      (name) => import(/* @vite-ignore */ base + name + ".js"),
    ),
  );
  const app = core.initializeApp(config);
  return {
    core,
    identity,
    auth: identity.getAuth(app),
    store,
    db: store.getFirestore(app),
  };
}

let connection;
export default function FirebaseGate() {
  const { pathname } = useLocation();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = Object.values(config).every(Boolean);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    let unsubscribe;
    connection ??= connect();
    connection
      .then((client) => {
        if (active)
          unsubscribe = client.identity.onAuthStateChanged(
            client.auth,
            (user) => setSession({ client, user }),
            () => setError("Não foi possível verificar a sessão."),
          );
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o Firebase.");
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [configured]);

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { identity, auth } = session.client;
    setBusy(true);
    setError("");
    try {
      await identity.signInWithEmailAndPassword(
        auth,
        form.get("email"),
        form.get("password"),
      );
    } catch {
      setError("Não foi possível entrar. Confira seus dados e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (session && pathname.replace(/\/$/, "") === "/cadastro")
    return <Cadastro client={session.client} />;
  if (session?.user) {
    const { client, user } = session;
    const masterPage = pathname.replace(/\/$/, "") === "/master";
    return (
      <WorkspaceAccess
        key={user.uid}
        client={client}
        user={user}
        onSignOut={() =>
          client.identity
            .signOut(client.auth)
            .catch(() => setError("Não foi possível sair."))
        }
      >
        {masterPage ? (
          <MasterPanel client={client} user={user} />
        ) : (
          <SchoolWorkspace client={client} user={user} />
        )}
        {error && <p role="alert">{error}</p>}
      </WorkspaceAccess>
    );
  }

  if (configured && !session && !error) return <Loading splash label="Verificando sessão…" />;
  return (
    <AccessLayout
      title="Entre na sua conta"
      description="Acesse o painel de suporte com seu e-mail e senha."
      footer={
        session && (
          <>
            Precisa de acesso? <Link to="/cadastro">Solicitar cadastro</Link>
          </>
        )
      }
    >
      {!configured ? (
        <p>Preencha o arquivo .env.local para conectar o Firebase.</p>
      ) : session ? (
        <form className="access-form" onSubmit={login} aria-busy={busy}>
          <label>
            E-mail
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <PasswordField />
          {error && (
            <p className="access-feedback" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? <Loading label="Entrando…" inline /> : "Entrar"}
          </button>
        </form>
      ) : error ? (
        <p className="access-feedback" role="alert">
          {error}
        </p>
      ) : (
        <Loading label="Verificando sessão…" />
      )}
    </AccessLayout>
  );
}

function useRole(client, user) {
  const [profile, setProfile] = useState(undefined);
  useEffect(
    () =>
      client.store.onSnapshot(
        client.store.doc(client.db, "roles", user.uid),
        (snapshot) => setProfile(snapshot.data() ?? null),
        () => setProfile(null),
      ),
    [client, user.uid],
  );
  return profile;
}

function Cadastro({ client }) {
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function register(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const whatsapp = whatsappNumber(fields.get('whatsapp'));
    if (fields.get('role') === 'admin' && !whatsapp) {
      setMessage('Informe o WhatsApp completo com código do país e DDD.');
      return;
    }
    const school = fields.get("school").trim();
    if (!school) {
      setMessage("Informe o nome da escola.");
      return;
    }
    const { core, identity, store } = client;
    setBusy(true);
    setMessage("");
    let app;
    let account;
    try {
      app = core.initializeApp(config, "cadastro");
      const auth = identity.initializeAuth(app, {
        persistence: identity.inMemoryPersistence,
      });
      ({ user: account } = await identity.createUserWithEmailAndPassword(
        auth,
        fields.get("email"),
        fields.get("password"),
      ));
      const requestDb = store.initializeFirestore(app, {});
      await store.setDoc(store.doc(requestDb, "requests", account.uid), {
        role: fields.get("role"),
        ...(fields.get('role') === 'admin' ? { whatsapp } : {}),
        school,
        email: account.email,
      });
      form.reset();
      setSubmitted(true);
    } catch (error) {
      let cleanupFailed = false;
      if (account) {
        try {
          await identity.deleteUser(account);
        } catch {
          cleanupFailed = true;
        }
      }
      setMessage(
        cleanupFailed
          ? "A conta foi criada sem perfil. Revise o usuário no console do Firebase."
          : error.code === "auth/email-already-in-use"
            ? "Este e-mail já está cadastrado."
            : "Não foi possível cadastrar. Confira os dados e as permissões do Firebase.",
      );
    } finally {
      try {
        if (app) await core.deleteApp(app);
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <AccessLayout
      title={submitted ? "Solicitação enviada" : "Solicite seu acesso"}
      description={
        submitted
          ? "Sua solicitação foi enviada para análise."
          : "Informe sua escola e o perfil de que você precisa."
      }
      footer={
        <>
          Já tem uma conta? <Link to="/">Voltar ao login</Link>
        </>
      }
    >
      {submitted ? (
        <div className="access-confirmation" role="status">
          <strong>Aguardando aprovação</strong>
          <p>
            Entre com o e-mail e a senha cadastrados para consultar o status. O acesso ao
            painel é liberado após a aprovação.
          </p>
          <Link className="btn btn-primary" to="/">
            Ir para o login
          </Link>
        </div>
      ) : (
        <form className="access-form" onSubmit={register} aria-busy={busy}>
          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Escola
            <input name="school" autoComplete="organization" maxLength={160} required />
          </label>
          <label>
            Perfil solicitado
            <select name="role" required value={role} onChange={event => setRole(event.target.value)}>
              <option value="" disabled>
                Selecione o perfil
              </option>
              <option value="admin">Administrador</option>
              <option value="tecnico">Técnico</option>
            </select>
          </label>
          {role === 'admin' && <label>WhatsApp com código do país e DDD
            <input name="whatsapp" type="tel" autoComplete="tel" placeholder="+55 11 99999-9999" maxLength={25} required />
          </label>}
          <PasswordField newPassword />
          <p className="access-note">
            A equipe responsável precisa aprovar sua solicitação para liberar o acesso.
          </p>
          {message && (
            <p className="access-feedback" role="alert">
              {message}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? <Loading label="Enviando…" inline /> : "Enviar solicitação"}
          </button>
        </form>
      )}
    </AccessLayout>
  );
}

function MasterPanel({ client, user }) {
  const [params] = useSearchParams();
  const tabs = [["geral", "Visão geral"], ["escolas", "Escolas"], ["equipe", "Equipe"], ["pedidos", "Pedidos"]];
  const tab = tabs.some(([id]) => id === params.get("secao")) ? params.get("secao") : "geral";
  const profile = useRole(client, user);
  const [requests, setRequests] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [people, setPeople] = useState(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const { store, db } = client;
  const [directory, setDirectory] = useState(null);
  const teamQuery = () => store.collection(db, "roles");
  const [summaries, setSummaries] = useState(null);
  const [summaryError, setSummaryError] = useState(false);
  useEffect(() => {
    if (profile?.role !== 'master') return;
    return store.onSnapshot(store.collection(db, 'schoolSummaries'), snapshot => {
      setSummaries(Object.fromEntries(snapshot.docs.map(doc => [doc.id, doc.data()])));
    }, () => setSummaryError(true));
  }, [store, db, profile?.role]);

  const directoryQuery = () => store.collection(db, "schoolDirectory");
  const readDirectory = (snapshot) =>
    snapshot.docs
      .map((doc) => ({ ...doc.data(), key: doc.id }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const requestsQuery = () => store.collection(db, "requests");
  const readTeam = (snapshot) =>
    snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  const readRequests = (snapshot) =>
    snapshot.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .filter((item) => item.status !== "rejected");

  useEffect(() => {
    if (profile?.role !== "master") return;
    const { store, db } = client;
    return store.onSnapshot(
      teamQuery(),
      (snapshot) => setPeople(readTeam(snapshot)),
      () => setFailed(true),
    );
  }, [client, profile?.role]);

  useEffect(() => {
    if (profile?.role !== "master") return;
    const { store, db } = client;
    return store.onSnapshot(
      requestsQuery(),
      (snapshot) => setRequests(readRequests(snapshot)),
      () => setReviewError("Não foi possível carregar as solicitações."),
    );
  }, [client, profile?.role]);

  useEffect(() => {
    if (profile?.role !== "master") return;
    return store.onSnapshot(
      directoryQuery(),
      (snapshot) => setDirectory(readDirectory(snapshot)),
      () => setReviewError("Não foi possível carregar as escolas."),
    );
  }, [client, profile?.role]);

  async function saveMember(event, person) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const school = directory?.find((item) => item.key === fields.get("school"));
    const disabled = fields.get("access") === "disabled";
    const moved = school && school.schoolId !== person.schoolId;
    if (
      (moved || disabled !== Boolean(person.disabled)) &&
      !window.confirm(
        "Aplicar a mudança de vínculo ou acesso a " + (person.email || person.id) + "?",
      )
    )
      return;
    setReviewing(true);
    setReviewError("");
    try {
      await store.updateDoc(store.doc(db, "roles", person.id), {
        disabled,
        ...(school ? { schoolId: school.schoolId, school: school.name } : {}),
      });
      setRefreshStatus({ message: "Acesso atualizado." });
    } catch {
      setReviewError("Não foi possível salvar o vínculo ou o acesso.");
    } finally {
      setReviewing(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    setRefreshStatus(null);
    try {
      const [admins, pending, schoolSnapshot] = await Promise.all([
        store.getDocsFromServer(teamQuery()),
        store.getDocsFromServer(requestsQuery()),
        store.getDocsFromServer(directoryQuery()),
      ]);
      setPeople(readTeam(admins));
      setDirectory(readDirectory(schoolSnapshot));
      setRequests(readRequests(pending));
      setFailed(false);
      setReviewError("");
      setRefreshStatus({ message: "Dados atualizados." });
    } catch {
      setRefreshStatus({
        error: true,
        message:
          "Não foi possível atualizar os dados. Confira a conexão e tente novamente.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function review(id, approved, schoolKey) {
    const { store, db } = client;
    setReviewing(true);
    setReviewError("");
    try {
      const request = store.doc(db, "requests", id);
      await store.runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(request);
        if (!snapshot.exists() || snapshot.data().status === "rejected") return;
        if (!approved) {
          transaction.update(request, { status: "rejected" });
          return;
        }
        const data = snapshot.data();
        const name = data.school.trim().replace(/\s+/g, " ");
        const key = encodeURIComponent(name.normalize("NFC").toLocaleLowerCase("pt-BR"));
        const schoolRef = store.doc(db, "schoolDirectory", schoolKey || key);
        const existing = await transaction.get(schoolRef);
        if (schoolKey && !existing.exists()) throw new Error("school-not-found");
        const schoolId = existing.exists()
          ? existing.data().schoolId
          : crypto.randomUUID();
        if (!existing.exists()) {
          transaction.set(schoolRef, { schoolId, name });
        }
        transaction.set(store.doc(db, "roles", id), {
          ...data,
          schoolId,
          school: existing.data()?.name ?? name,
        });
        transaction.delete(request);
      });
    } catch {
      setReviewError("Não foi possível atualizar a solicitação.");
    } finally {
      setReviewing(false);
    }
  }

  const schools = new Map();
  const admins = people?.filter(
    (person) =>
      !person.disabled &&
      (person.role === "admin" || (person.role === "master" && person.schoolId)),
  );
  for (const person of admins ?? []) {
    const school = person.school || "Sem escola vinculada";
    if (!schools.has(school)) schools.set(school, []);
    schools.get(school).push(person);
  }
  return (
    <div className="page master-page">
      <Link to="/">Voltar ao painel</Link>
      <h1>Painel master</h1>
      {profile === undefined && <Loading label="Verificando acesso…" />}
      {profile !== undefined && profile?.role !== "master" && (
        <p role="alert">Acesso restrito à conta master.</p>
      )}
      {profile?.role === "master" && (
        <>
          <div className="page-heading">
            <p>Gerencie os acessos e acompanhe os responsáveis por escola.</p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={refreshing || reviewing}
              onClick={refresh}
            >
              {refreshing ? <Loading label="Atualizando…" inline /> : "Atualizar dados"}
            </button>
          </div>
          {refreshStatus && (
            <p role={refreshStatus.error ? "alert" : "status"}>{refreshStatus.message}</p>
          )}
          <nav className="master-tabs" aria-label="Seções do Painel master">
            {tabs.map(([id, label]) => <Link key={id} to={id === "geral" ? "/master" : "/master?secao=" + id}
              aria-current={tab === id ? "page" : undefined}>{label}</Link>)}
          </nav>
          {tab !== "geral" && reviewError && <p role="alert">{reviewError}</p>}
          {tab === "geral" && <>
          <div className="master-metrics">
            <div className="panel master-metric">
              <span>Solicitações pendentes</span>
              <strong>{requests?.length ?? "—"}</strong>
            </div>
            <div className="panel master-metric">
              <span>Administradores</span>
              <strong>{admins?.length ?? "—"}</strong>
            </div>
            <div className="panel master-metric">
              <span>Escolas com administrador</span>
              <strong>
                {people
                  ? schools.size - Number(schools.has("Sem escola vinculada"))
                  : "—"}
              </strong>
            </div>
          </div>
          <div className="master-columns">
            <section className="panel master-section">
              <h2>Solicitações pendentes</h2>
              {reviewError && <p role="alert">{reviewError}</p>}
              {requests && requests.length === 0 && <p>Nenhuma solicitação pendente.</p>}
              {!requests && !reviewError && <Loading label="Carregando solicitações…" />}
              {requests?.map((request) => (
                <section className="panel master-school" key={request.id}>
                  <h3>{request.school}</h3>
                  <p>
                    {request.email} ·{" "}
                    {request.role === "admin" ? "Administrador" : "Técnico"}
                  </p>
                  {whatsappLink(request.whatsapp) && <p><a href={whatsappLink(request.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp +{request.whatsapp}</a></p>}
                  <form
                    className="access-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      review(
                        request.id,
                        true,
                        new FormData(event.currentTarget).get("school"),
                      );
                    }}
                  >
                    <label>
                      Escola para o vínculo
                      <select name="school">
                        <option value="">Usar escola informada na solicitação</option>
                        {directory?.map((school) => (
                          <option key={school.key} value={school.key}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="btn btn-primary"
                      disabled={!directory || reviewing || refreshing}
                    >
                      Aprovar
                    </button>
                  </form>
                  <div className="review-actions master-review">
                    <button
                      className="btn btn-outline"
                      disabled={reviewing || refreshing}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Recusar a solicitação de " + request.email + "?",
                          )
                        )
                          review(request.id, false);
                      }}
                    >
                      Recusar
                    </button>
                  </div>
                </section>
              ))}
            </section>
            <section className="panel master-section">
              <h2>Administradores por escola</h2>
              {failed ? (
                <p role="alert">Não foi possível carregar os administradores.</p>
              ) : people === null ? (
                <Loading label="Carregando administradores…" />
              ) : admins.length === 0 ? (
                <p>Nenhum administrador cadastrado.</p>
              ) : (
                [...schools]
                  .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                  .map(([school, admins]) => (
                    <section className="panel master-school" key={school}>
                      <h2>{school}</h2>
                      <ul>
                        {admins.map((admin) => (
                          <li key={admin.id}>{admin.email || admin.id}</li>
                        ))}
                      </ul>
                    </section>
                  ))
              )}
            </section>
          </div>
          </>}{tab === "escolas" && <section className="panel master-section master-team">
            <h2>Visão por escola</h2>
            {summaryError && <p role="alert">Não foi possível carregar os indicadores.</p>}
            {directory?.length === 0 && <p>Nenhuma escola cadastrada.</p>}
            <div className="school-overview">
              {directory?.map(school => {
                const team = people?.filter(person => !person.disabled && person.schoolId === school.schoolId);
                const counts = summaries?.[school.schoolId];
                return <article className="panel master-school" key={school.schoolId}>
                  <h3>{school.name}</h3>
                  <p>{team ? team.filter(person => ['admin', 'master'].includes(person.role)).length : '—'} administradores ativos</p>
                  <p>{team ? team.filter(person => person.role === 'tecnico').length : '—'} técnicos ativos</p>
                  <p>{counts ? counts.rooms + ' ambientes · ' + counts.open + ' chamados em aberto' : 'Indicadores ainda não sincronizados'}</p>
                </article>;
              })}
            </div>
          </section>
          }
          {tab === "pedidos" && <><SupportContact client={client} />
          <SchoolSupport client={client} master /></>}
          {tab === "equipe" &&
          <section className="panel master-section master-team">
            <h2>Equipe e acessos</h2>
            <p>
              Alterar a escola muda o espaço de trabalho do usuário. Os registros
              permanecem na escola em que foram criados.
            </p>
            {people
              ?.filter((person) => ["admin", "tecnico"].includes(person.role))
              .map((person) => {
                const linkedSchool = directory?.find(
                  (school) => school.schoolId === person.schoolId,
                );
                return (
                  <form
                    key={
                      person.id + ":" + person.schoolId + ":" + Boolean(person.disabled)
                    }
                    className="master-member access-form"
                    onSubmit={(event) => saveMember(event, person)}
                  >
                    <div>
                      <strong>{person.email || person.id}</strong>
                    {whatsappLink(person.whatsapp) && <p><a href={whatsappLink(person.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp +{person.whatsapp}</a></p>}
                      <p>
                        {person.role === "admin" ? "Administrador" : "Técnico"} ·{" "}
                        {person.school || "Sem escola"}
                      </p>
                    </div>
                    <label>
                      Escola
                      <select name="school" defaultValue={linkedSchool?.key ?? ""}>
                        <option value="">Manter vínculo atual</option>
                        {directory?.map((school) => (
                          <option key={school.key} value={school.key}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Acesso
                      <select
                        name="access"
                        defaultValue={person.disabled ? "disabled" : "active"}
                      >
                        <option value="active">Ativo</option>
                        <option value="disabled">Desativado</option>
                      </select>
                    </label>
                    <button
                      className="btn btn-outline"
                      disabled={!directory || reviewing || refreshing}
                    >
                      Salvar
                    </button>
                  </form>
                );
              })}
          </section>
          }
        </>
      )}
    </div>
  );
}

function WorkspaceAccess({ client, user, children, onSignOut }) {
  const profile = useRole(client, user);
  const canAccess = !profile?.disabled && ["master", "admin", "tecnico"].includes(profile?.role);
  const supportContact = useSupportContact(client, canAccess);
  const [rejected, setRejected] = useState(false);
  useEffect(() => {
    if (profile !== null) return;
    const { store, db } = client;
    return store.onSnapshot(
      store.doc(db, "requests", user.uid),
      (snapshot) => setRejected(snapshot.data()?.status === "rejected"),
      () => setRejected(false),
    );
  }, [client, profile, user.uid]);

  if (!profile?.disabled && ["master", "admin", "tecnico"].includes(profile?.role)) {
    return (
      <WorkspaceShell
        master={profile.role === "master"}
        supportUrl={whatsappLink(supportContact)}
        schoolSupport={Boolean(profile.schoolId) && ["admin", "master"].includes(profile.role)}
        email={user.email}
        onSignOut={onSignOut}
      >
        {children}
      </WorkspaceShell>
    );
  }
  return (
    <main className="login-screen">
      <section className="panel login-card">
        <h1>ConectaTI</h1>
        <p role="status">
          {profile === undefined
            ? <Loading label="Verificando acesso…" inline />
            : profile?.disabled
              ? "Seu acesso foi desativado."
              : rejected
                ? "Sua solicitação de cadastro foi recusada."
                : "Seu acesso depende da aprovação da conta master."}
        </p>
        <button className="btn btn-outline" onClick={onSignOut}>
          Sair
        </button>
      </section>
    </main>
  );
}

function SchoolWorkspace({ client, user }) {
  const { pathname } = useLocation();
  const profile = useRole(client, user);
  if (!profile) return <Loading label="Carregando perfil…" />;

  return (
    <AppProvider
      key={profile.schoolId ?? user.uid}
      client={client}
      uid={user.uid}
      schoolId={profile.schoolId}
      canManage={profile.role !== "tecnico"}
      canImport={profile.role === "master"}
    >
      {!profile.schoolId && profile.role !== "master" && (
        <div className="page" role="status">
          Espaço individual. O responsável master pode vincular esta conta ao espaço
          compartilhado da escola.
        </div>
      )}
      {pathname === '/apoio' ? (profile.schoolId && ['admin', 'master'].includes(profile.role) ? (
        <div className="page"><SchoolSupportPage client={client} schoolId={profile.schoolId}
          schoolName={profile.school || 'Escola vinculada'} /></div>
      ) : <p className="page">Disponível para administradores vinculados a uma escola.</p>) : <App />}
    </AppProvider>
  );
}

function SchoolSupportPage(props) {
  const { syncSummary } = useApp();
  const [syncing, setSyncing] = useState(false);
  return <>
    <div className="page-heading"><div><h1>Apoio à escola</h1><p>{props.schoolName}</p></div>
      <button className="btn btn-outline" disabled={syncing} onClick={async () => {
        setSyncing(true);
        try { await syncSummary(); } finally { setSyncing(false); }
      }}>{syncing ? <Loading label="Sincronizando…" inline /> : 'Sincronizar indicadores'}</button>
    </div>
    <SchoolSupport {...props} />
    <Toaster position="top-right" />
  </>;
}
