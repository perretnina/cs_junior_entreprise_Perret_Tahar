import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';

type KpiCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  to: string;
};

export default function KpiCard({
  title,
  value,
  icon: Icon,
  to,
}: KpiCardProps) {
  return (
    <Link
      to={to}
      className="card kpi-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = '';
      }}
    >
      <div className="kpi-header">
        <p className="kpi-title">{title}</p>
        <Icon className="kpi-icon" size={22} />
      </div>

      <p className="kpi-value">{value}</p>
    </Link>
  );
}
