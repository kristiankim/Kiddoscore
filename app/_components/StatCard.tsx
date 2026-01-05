interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'flat';
}

export function StatCard({ title, value, subtitle, className = '', variant = 'default' }: StatCardProps) {
  const cardClass = variant === 'flat' ? 'card-flat' : 'card';
  return (
    <div className={`${cardClass} ${className}`}>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}