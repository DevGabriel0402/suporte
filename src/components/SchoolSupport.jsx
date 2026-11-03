import { useEffect, useState } from "react";
import Loading from "./Loading";

export default function SchoolSupport({ client, schoolId, schoolName, master = false }) {
  const { store, db } = client;
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [school, setSchool] = useState("");
  const [priority, setPriority] = useState("");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const source = master
      ? store.collection(db, "schoolSupport")
      : store.query(
          store.collection(db, "schoolSupport"),
          store.where("schoolId", "==", schoolId),
        );
    return store.onSnapshot(
      source,
      (snapshot) => {
        setItems(
          snapshot.docs
            .map((doc) => ({ ...doc.data(), id: doc.id }))
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)),
        );
      },
      () => setError("Não foi possível carregar os pedidos."),
    );
  }, [store, db, master, schoolId]);

  async function save(event, item) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const message = String(fields.get("message")).trim();
    if (!message || (!item && !String(fields.get("subject")).trim())) {
      setError("Preencha o assunto e a mensagem antes de enviar.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (item) {
        await store.updateDoc(store.doc(db, "schoolSupport", item.id), {
          response: message,
          status: fields.get("status"),
          updatedAt: store.serverTimestamp(),
        });
      } else {
        await store.addDoc(store.collection(db, "schoolSupport"), {
          schoolId,
          schoolName,
          authorUid: client.auth.currentUser.uid,
          message,
          subject: String(fields.get("subject")).trim(),
          priority: fields.get("priority"),
          status: "open",
          createdAt: store.serverTimestamp(),
        });
      }
      if (!item) form.reset();
      setNotice(item ? "Resposta salva." : "Pedido enviado ao master.");
    } catch {
      setError("Não foi possível salvar. Verifique sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const labels = { open: "Aberto", progress: "Em atendimento", resolved: "Resolvido" };
  const priorities = { normal: "Normal", high: "Alta", urgent: "Urgente" };
  const priorityOf = (item) => item.priority ?? "normal";
  const subjectOf = (item) => item.subject || item.message.split("\n")[0].slice(0, 80);
  const schools = [...new Set(items?.map((item) => item.schoolName))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = (items ?? []).filter(
    (item) =>
      (!school || item.schoolName === school) &&
      (!priority || priorityOf(item) === priority) &&
      [subjectOf(item), item.message, item.schoolName].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term),
      ),
  );
  const active = items?.find((item) => item.id === selected);
  const dateOf = (item) => item.createdAt?.toDate().toLocaleDateString("pt-BR");

  return (
    <section className="panel master-section master-team">
      <h2>{master ? "Pedidos das escolas" : "Pedidos ao master"}</h2>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!master && (
        <details className="crm-new">
          <summary>Novo pedido</summary>
          <form className="access-form" onSubmit={(event) => save(event)}>
            <label>
              Assunto
              <input name="subject" maxLength={120} required />
            </label>
            <label>
              Prioridade
              <select name="priority" defaultValue="normal">
                {Object.entries(priorities).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Como podemos ajudar?
              <textarea name="message" rows={3} maxLength={2000} required />
            </label>
            <div>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? <Loading label="Enviando…" inline /> : "Enviar pedido"}
              </button>
            </div>
          </form>
        </details>
      )}
      {!items && !error && <Loading label="Carregando pedidos…" />}
      {items && (
        <>
          <div className="crm-filters access-form">
            <label>
              Buscar pedidos
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Assunto ou descrição"
              />
            </label>
            {master && (
              <label>
                Escola
                <select
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                >
                  <option value="">Todas as escolas</option>
                  {schools.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Prioridade
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="">Todas as prioridades</option>
                {Object.entries(priorities).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {active && (
            <article className="panel crm-detail" aria-labelledby="crm-detail-title">
              <div className="crm-detail-head">
                <div>
                  <h3 id="crm-detail-title">{subjectOf(active)}</h3>
                  <p>
                    {active.schoolName} · {labels[active.status]} · Prioridade{" "}
                    {priorities[priorityOf(active)]}
                    {dateOf(active) && " · " + dateOf(active)}
                  </p>
                </div>
                <button className="btn btn-outline" onClick={() => setSelected(null)}>
                  Fechar ficha
                </button>
              </div>
              <p className="support-message">{active.message}</p>
              {active.response && (
                <p className="support-message">
                  <strong>Resposta do master</strong>
                  <br />
                  {active.response}
                </p>
              )}
              {master && (
                <form
                  className="access-form"
                  key={
                    active.id +
                    ":" +
                    active.updatedAt?.seconds +
                    ":" +
                    active.updatedAt?.nanoseconds
                  }
                  onSubmit={(event) => save(event, active)}
                >
                  <label>
                    Etapa
                    <select name="status" defaultValue={active.status}>
                      {Object.entries(labels).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Resposta
                    <textarea
                      name="message"
                      rows={2}
                      maxLength={2000}
                      defaultValue={active.response}
                      required
                    />
                  </label>
                  <div>
                    <button className="btn btn-primary" disabled={busy}>
                      {busy ? (
                        <Loading label="Salvando…" inline />
                      ) : (
                        "Salvar resposta e etapa"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </article>
          )}
          <div className="crm-board">
            {Object.entries(labels).map(([status, label]) => {
              const cards = filtered.filter((item) => item.status === status);
              return (
                <section className="crm-column" key={status}>
                  <h3>
                    {label} <span>{cards.length}</span>
                  </h3>
                  {cards.length === 0 && <p>Nenhum pedido nesta etapa.</p>}
                  {cards.map((item) => (
                    <button
                      type="button"
                      className="crm-card"
                      aria-pressed={selected === item.id}
                      key={item.id}
                      onClick={() => setSelected(item.id)}
                    >
                      <strong>{subjectOf(item)}</strong>
                      {master && <span>{item.schoolName}</span>}
                      <span className="crm-card-meta">
                        <span data-priority={priorityOf(item)}>
                          {priorities[priorityOf(item)]}
                        </span>
                        {dateOf(item)}
                      </span>
                    </button>
                  ))}
                </section>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
