import { useEffect, useState } from "react";
import { whatsappNumber } from "../utils/whatsapp";

export function useSupportContact(client, enabled = true) {
  const [contact, setContact] = useState(undefined);
  const { store, db } = client;
  useEffect(() => {
    if (!enabled) return;
    return store.onSnapshot(
      store.doc(db, "settings", "support"),
      (snapshot) => setContact(snapshot.data()?.whatsapp ?? ""),
      () => setContact(null),
    );
  }, [store, db, enabled]);
  return contact;
}

export default function SupportContact({ client }) {
  const contact = useSupportContact(client);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(event) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("whatsapp")).trim();
    const whatsapp = whatsappNumber(value);
    if (value && !whatsapp) {
      setStatus({
        error: true,
        text: "Informe o número completo com código do país e DDD.",
      });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const { store, db } = client;
      await store.setDoc(store.doc(db, "settings", "support"), { whatsapp });
      setStatus({
        text: whatsapp ? "Contato de suporte publicado." : "Contato de suporte removido.",
      });
    } catch {
      setStatus({ error: true, text: "Não foi possível salvar o contato de suporte." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel master-section master-team">
      <h2>Contato de suporte</h2>
      <p>
        O número aparece no menu lateral dos usuários aprovados. Deixe em branco para
        ocultar o atalho.
      </p>
      {contact === undefined ? (
        <p role="status">Carregando contato…</p>
      ) : contact === null ? (
        <p role="alert">Não foi possível carregar o contato de suporte.</p>
      ) : (
        <form className="access-form support-contact-form" onSubmit={save}>
          <label>
            WhatsApp com código do país e DDD
            <input
              key={contact}
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              defaultValue={contact ? "+" + contact : ""}
              placeholder="+55 11 99999-9999"
              maxLength={25}
            />
          </label>
          <div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar contato"}
            </button>
          </div>
        </form>
      )}
      {status && <p role={status.error ? "alert" : "status"}>{status.text}</p>}
    </section>
  );
}
