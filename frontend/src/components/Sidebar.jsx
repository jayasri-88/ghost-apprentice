import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Video,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Upload Recording", path: "/upload", icon: Video },
  { name: "Knowledge Manuals", path: "/manuals", icon: BookOpen },
  { name: "Assistant", path: "/ghost", icon: MessageSquare },
];

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-surface border-r border-line flex flex-col">
      <div className="p-5 border-b border-line flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-text text-white font-display flex items-center justify-center">
          G
        </div>
        <div>
          <h1 className="font-display font-semibold text-[15px] leading-tight">
            Ghost Apprentice
          </h1>
          <p className="text-[11px] text-text-subtle">Knowledge preservation</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-canvas text-text font-medium"
                    : "text-text-muted hover:bg-canvas hover:text-text"
                }`
              }
            >
              <Icon size={17} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
