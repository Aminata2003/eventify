import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  iconBg = "bg-orange-50",
  iconColor = "text-primary",
}) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        {typeof change === "number" && (
          <span
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? "text-green-600" : "text-red-500"
            }`}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
