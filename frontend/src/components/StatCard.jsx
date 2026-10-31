export default function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-subtle">{title}</p>
        {Icon && <Icon size={16} className="text-text-subtle" />}
      </div>
      <h3 className="font-display text-3xl font-semibold mt-2">{value}</h3>
      <p className="text-xs text-text-muted mt-2">{description}</p>
    </div>
  );
}
