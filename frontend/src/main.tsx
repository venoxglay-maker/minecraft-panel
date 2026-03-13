import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import { DashboardPage } from "./pages/DashboardPage";
import { ServerDetailPage } from "./pages/ServerDetailPage";
import { ModpacksPage } from "./pages/ModpacksPage";
import { UsersPage } from "./pages/UsersPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/servers/:id" element={<ServerDetailPage />} />
          <Route path="/modpacks" element={<ModpacksPage />} />
          <Route path="/settings" element={<UsersPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

