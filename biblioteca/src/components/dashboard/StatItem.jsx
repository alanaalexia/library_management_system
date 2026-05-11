export const StatItem = ({ count, label, color = "text-gray-700" }) => (
  <div className="flex items-center gap-2 py-2 text-lg">
    <span className={`font-bold ${color}`}>{count}</span>
    <span className={color}>{label}</span>
  </div>
);