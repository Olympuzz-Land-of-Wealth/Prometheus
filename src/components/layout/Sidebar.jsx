import { Link, useLocation } from 'react-router-dom';
import { Upload, Activity, Flame, FileBarChart2 } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Video Upload', icon: Upload, description: 'Upload & Process' },
  { path: '/dashboard', label: 'Detection Player', icon: Activity, description: 'Review Results' },
  { path: '/report', label: 'Report', icon: FileBarChart2, description: 'Stats & History' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[240px] min-w-[240px] h-screen bg-prometheus-sidebar border-r border-prometheus-border flex flex-col font-inter">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-prometheus-green/10 flex items-center justify-center">
          <Flame className="w-5 h-5 text-prometheus-green" />
        </div>
        <div>
          <h1 className="text-prometheus-cream font-semibold text-[15px] tracking-tight leading-none">Prometheus</h1>
          <p className="text-prometheus-secondary text-[11px] mt-0.5">Gym Intelligence</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-prometheus-border" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-prometheus-elevated text-prometheus-cream'
                  : 'text-prometheus-secondary hover:bg-prometheus-hover hover:text-prometheus-cream'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-prometheus-green' : 'text-prometheus-secondary group-hover:text-prometheus-cream'}`} />
              <div>
                <p className="text-[13px] font-medium leading-none">{item.label}</p>
                <p className={`text-[10px] mt-0.5 ${isActive ? 'text-prometheus-secondary' : 'text-prometheus-secondary/60'}`}>{item.description}</p>
              </div>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-prometheus-green" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-prometheus-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-prometheus-elevated flex items-center justify-center text-prometheus-cream text-[11px] font-semibold">
            GP
          </div>
          <div>
            <p className="text-prometheus-cream text-[12px] font-medium leading-none">Gym Pro</p>
            <p className="text-prometheus-secondary text-[10px] mt-0.5">Owner Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}