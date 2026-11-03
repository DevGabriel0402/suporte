import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import Loading from "./Loading";

export default function DeleteConfirmation({ target, onClose, onDelete }) {
  const dialog = useRef(null);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const confirmed = word.trim().toLowerCase() === "excluir";

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true);
    setError(false);
    try {
      if (await onDelete()) onClose();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="delete-dialog"
      aria-labelledby="delete-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form className="access-form" onSubmit={submit} aria-busy={busy}>
        <div className="delete-icon">
          <Trash2 size={21} aria-hidden="true" />
        </div>
        <h2 id="delete-title">Confirmar exclusão</h2>
        <p>
          Você está prestes a excluir <strong>{target}</strong>. Esta ação é permanente.
        </p>
        <label style={{ display: "block" }}>
          Digite <strong style={{ fontWeight: "bold", color: "red" }}>excluir</strong>{" "}
          para confirmar
          <input
            value={word}
            onChange={(event) => setWord(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy}
          />
        </label>
        {error && (
          <p className="access-feedback" role="alert">
            A exclusão não foi concluída. Confira o aviso da aplicação ou tente novamente.
          </p>
        )}
        <div className="delete-actions">
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="btn btn-danger" disabled={!confirmed || busy}>
            {busy ? <Loading label="Excluindo…" inline /> : "Excluir"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
