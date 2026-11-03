import { useEffect, useState } from "react";

export default function PwaActions() {
  const [install, setInstall] = useState(null);
  const [worker, setWorker] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.standalone;

  useEffect(() => {
    let active = true;
    let registration;
    let installing;
    let requested = false;
    function offer(event) {
      event.preventDefault();
      setInstall(event);
    }
    function installed() {
      setInstall(null);
    }
    function changed() {
      if (requested) window.location.reload();
    }
    function watchState() {
      if (active && registration?.waiting && navigator.serviceWorker.controller)
        setWorker(registration.waiting);
    }
    function watchUpdate() {
      installing?.removeEventListener("statechange", watchState);
      installing = registration.installing;
      installing?.addEventListener("statechange", watchState);
      watchState();
    }
    function applyUpdate(event) {
      requested = true;
      event.detail.postMessage({ type: "SKIP_WAITING" });
    }
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("conectati-update", applyUpdate);
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", changed);
      navigator.serviceWorker
        .register("/sw.js")
        .then((result) => {
          if (!active) return;
          registration = result;
          registration.addEventListener("updatefound", watchUpdate);
          watchUpdate();
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("conectati-update", applyUpdate);
      navigator.serviceWorker?.removeEventListener("controllerchange", changed);
      registration?.removeEventListener("updatefound", watchUpdate);
      installing?.removeEventListener("statechange", watchState);
    };
  }, []);

  if (!import.meta.env.PROD || (!install && !ios && !worker)) return null;
  return (
    <aside className="pwa-actions" aria-label="Opções do aplicativo">
      {install && (
        <button
          className="btn btn-outline"
          onClick={async () => {
            try {
              await install.prompt();
            } finally {
              setInstall(null);
            }
          }}
        >
          Instalar ConectaTI
        </button>
      )}
      {!install && ios && (
        <button
          className="btn btn-outline"
          aria-expanded={showHelp}
          onClick={() => setShowHelp(!showHelp)}
        >
          Como instalar
        </button>
      )}
      {showHelp && (
        <p>No Safari, toque em Compartilhar e em Adicionar à Tela de Início.</p>
      )}
      {worker && (
        <button
          className="btn btn-primary"
          onClick={() => {
            if (
              confirm(
                "Recarregar para instalar a nova versão? Salve seu trabalho antes de continuar.",
              )
            ) {
              window.dispatchEvent(
                new CustomEvent("conectati-update", { detail: worker }),
              );
            }
          }}
        >
          Nova versão disponível
        </button>
      )}
    </aside>
  );
}
