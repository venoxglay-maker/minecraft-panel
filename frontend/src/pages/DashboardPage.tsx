import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Layout } from "../components/Layout";

type SummaryResponse = {
  totalServers: number;
  runningServers: number;
  playersOnline: number;
};

export const DashboardPage: React.FC = () => {
  const apiBase = `${window.location.protocol}//${window.location.host}`;
  const token = localStorage.getItem("accessToken") || "";

  const { data, refetch, isLoading } = useQuery<SummaryResponse>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await axios.get<SummaryResponse>(`${apiBase}/api/v1/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const totalServers = data?.totalServers ?? 0;
  const activePlayers = data?.playersOnline ?? 0;
  const runningServers = data?.runningServers ?? 0;
  const memoryUsage = { used: 15.3, total: 32.0 };
  const avgTps = 20.0;
  const cpu = 8.6;

  return (
    <Layout>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Monitor and manage your Minecraft server infrastructure
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-200"
            onClick={() => refetch()}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-accent.green text-sm text-black">
            New Server
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 mb-2">TOTAL SERVERS</div>
          <div className="text-3xl font-semibold mb-1">{totalServers}</div>
          <div className="text-xs text-slate-500">
            {runningServers} active
          </div>
        </div>
        <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 mb-2">ACTIVE PLAYERS</div>
          <div className="text-3xl font-semibold mb-1">{activePlayers}</div>
          <div className="text-xs text-slate-500">players online</div>
        </div>
        <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 mb-2">MEMORY USAGE</div>
          <div className="text-xl font-semibold mb-1">
            {memoryUsage.used} / {memoryUsage.total} GB
          </div>
          <div className="text-xs text-slate-500">Used / Allocated</div>
        </div>
        <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 mb-2">PERFORMANCE</div>
          <div className="text-xl font-semibold mb-1">{avgTps.toFixed(1)} Avg. TPS</div>
          <div className="text-xs text-slate-500">{cpu.toFixed(1)}% CPU</div>
        </div>
      </div>

      {/* Server overview and static sections kept as in the mock, can later be wired to /servers */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1.5fr] gap-4 mb-6">
        <section className="bg-bg.card rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Server Overview</h2>
            <button className="text-xs text-accent.blue">View All</button>
          </div>
          <div className="space-y-2">
            {[
              { name: "RLCraft", version: "1.12.2", online: true, players: "1/20", tps: 20.0 },
              { name: "TESTER2", version: "1.12.2", online: true, players: "1/20", tps: 20.5 },
              { name: "SkyFactory 4", version: "1.12.2", online: true, players: "0/20", tps: 20.0 }
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      s.online ? "bg-accent.green" : "bg-accent.red"
                    }`}
                  />
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.version}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span>{s.players}</span>
                  <span>{s.tps.toFixed(1)} TPS</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
            <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
            <div className="space-y-2 text-xs text-slate-300">
              <div>SkyFactory 4 • Started • vor 5 Minuten</div>
              <div>RLCraft • Started • vor 10 Minuten</div>
              <div>TESTER2 • Started • vor 12 Minuten</div>
            </div>
          </div>
          <div className="bg-bg.card rounded-xl p-4 border border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-semibold mb-2">Need Help?</h2>
              <div className="space-y-2 text-xs">
                <button className="w-full bg-slate-900/70 rounded-lg px-3 py-2 text-left">
                  Join Discord Server
                </button>
                <button className="w-full bg-slate-900/70 rounded-lg px-3 py-2 text-left">
                  Report an Issue
                </button>
                <button className="w-full bg-slate-900/70 rounded-lg px-3 py-2 text-left">
                  Documentation
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold mb-2">System Health</h2>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Services: Operational</div>
                <div>Network: Connected</div>
                <div>Storage: 19.96 MB / 847.06 GB</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

