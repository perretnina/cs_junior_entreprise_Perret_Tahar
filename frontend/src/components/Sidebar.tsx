
import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  Users,
  ChartNoAxesCombined,
} from 'lucide-react';

const navigation = [
  { label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
  { label: 'Missions', path: '/missions', icon: BriefcaseBusiness },
  { label: 'Prospects', path: '/prospects', icon: Building2 },
  { label: 'Intervenants', path: '/intervenants', icon: Users },
  { label: 'KPI', path: '/kpi', icon: ChartNoAxesCombined },
];

export default function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 p-6 text-white">
      <h1 className="mb-10 text-xl font-bold">Junior-Entreprise</h1>

      <nav className="space-y-2">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
