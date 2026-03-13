import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";

type User = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
};

export const UsersPage: React.FC = () => {
  const apiBase = `${window.location.protocol}//${window.location.host}`;
  const token = localStorage.getItem("accessToken") || "";

  const { data } = useQuery<{ users: User[] }>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get<{ users: User[] }>(`${apiBase}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      <div className="bg-bg.card rounded-xl border border-slate-800 overflow-hidden text-sm">
        <table className="w-full">
          <thead className="bg-slate-900/60 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Display Name</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.display_name}</td>
                <td className="px-3 py-2 uppercase text-xs">{u.role}</td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {new Date(u.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

