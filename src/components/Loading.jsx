export default function Loading({ label, inline = false, splash = false }) {
  if (splash)
    return (
      <div className="boot-screen" role="status">
        <img src="/icon.svg" alt="" />
        <strong>ConectaTI</strong>
        <span className="boot-ring" aria-hidden="true" />
        <p>{label}</p>
      </div>
    );

  return (
    <span className="app-loading" role={inline ? undefined : "status"}>
      <span className="loading-ring" aria-hidden="true" />
      {label}
    </span>
  );
}
