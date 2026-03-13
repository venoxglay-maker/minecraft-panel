import React, { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/servers", label: "Servers" },
  { to: "/modpacks", label: "Modpacks" },
  { to: "/settings", label: "Settings" }
];

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 bg-bg-subtle border-r border-slate-800 p-4 flex flex-col">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-accent.green/20 flex items-center justify-center text-accent.green font-bold">
            DP
          </div>
          <div>
            <div className="font-semibold">DiscoPanel</div>
            <div className="text-xs text-slate-400">Minecraft Infrastructure</div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                  active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 text-xs text-slate-500">v0.1.0 • alpha</div>
      </aside>
      <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

