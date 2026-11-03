export default function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "blue",
  onClick,
}) {
  const Card = onClick ? "button" : "article";
  return (
    <Card className="stat-card" onClick={onClick}>
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </Card>
  );
}
