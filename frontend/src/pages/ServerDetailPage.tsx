import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import axios from "axios";
import { Layout } from "../components/Layout";

type Metrics = {
  cpuPercent: number | null;
  memoryMb: number | null;
};

type FileItem = {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
};

export const ServerDetailPage: React.FC = () => {
  const { id } = useParams();
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ cpuPercent: null, memoryMb: null });
  const [command, setCommand] = useState("");
  const [activeTab, setActiveTab] = useState<"console" | "files">("console");
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const consoleRef = useRef<HTMLDivElement | null>(null);

  const socket: Socket | null = useMemo(() => {
    if (!id) return null;
    const token = localStorage.getItem("accessToken") || "";
    const url = `${window.location.protocol === "https:" ? "wss" : "ws"}://${
      window.location.host
    }/ws/server/${id}`;
    return io(url, {
      auth: { token },
      transports: ["websocket"]
    });
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.on("console:line", (payload: { line: string }) => {
      setConsoleLines((prev) => [...prev, payload.line].slice(-500));
    });

    socket.on("metrics:update", (next: Metrics) => {
      setMetrics(next);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLines]);

  const handleSend = () => {
    if (!socket || !command.trim()) return;
    socket.emit("console:command", { command: command.trim() });
    setCommand("");
  };

  const memoryDisplay = metrics.memoryMb != null ? `${(metrics.memoryMb / 1024).toFixed(1)} GB` : "–";
  const cpuDisplay =
    metrics.cpuPercent != null && Number.isFinite(metrics.cpuPercent)
      ? `${metrics.cpuPercent.toFixed(2)}%`
      : "–";

  const apiBase = `${window.location.protocol}//${window.location.host}`;

  const loadDirectory = async (path: string) => {
    if (!id) return;
    const token = localStorage.getItem("accessToken") || "";
    const res = await axios.get<{ items: FileItem[] }>(
      `${apiBase}/api/v1/servers/${id}/files/list`,
      {
        params: { path },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    setItems(
      res.data.items.map((i) => ({
        ...i,
        mtime: typeof i.mtime === "string" ? i.mtime : new Date(i.mtime as any).toISOString()
      }))
    );
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent("");
  };

  const openFile = async (path: string) => {
    if (!id) return;
    const token = localStorage.getItem("accessToken") || "";
    const res = await axios.get<{ content: string }>(
      `${apiBase}/api/v1/servers/${id}/files/content`,
      {
        params: { path },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    setSelectedFile(path);
    setFileContent(res.data.content);
  };

  const saveFile = async () => {
    if (!id || !selectedFile) return;
    const token = localStorage.getItem("accessToken") || "";
    await axios.put(
      `${apiBase}/api/v1/servers/${id}/files/content`,
      { path: selectedFile, content: fileContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    const token = localStorage.getItem("accessToken") || "";
    const form = new FormData();
    form.append("file", e.target.files[0]);
    await axios.post(
      `${apiBase}/api/v1/servers/${id}/files/upload`,
      form,
      {
        params: { path: currentPath },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    await loadDirectory(currentPath);
    e.target.value = "";
  };

  useEffect(() => {
    if (id) {
      loadDirectory("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Server {id}</h1>
          <p className="text-sm text-slate-400">Live console and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-200">
            Stop
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-200">
            Restart
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-accent.red text-sm text-black">
            Delete Server
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-4 mb-4">
        <section className="bg-bg.card rounded-xl p-4 border border-slate-800">
          <h2 className="text-sm font-semibold mb-2">Server Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">STATUS</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent.green" />
                <span className="text-sm font-medium">RUNNING</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
            <h2 className="text-sm font-semibold mb-2">Connection</h2>
            <div className="text-xs text-slate-400 mb-1">Server Address</div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                className="flex-1 bg-slate-900/70 rounded-lg px-3 py-1.5 text-xs text-slate-200 border border-slate-800"
                value={`mc.${window.location.hostname}:${25565}`}
              />
              <button className="px-2 py-1.5 rounded-lg bg-slate-800 text-xs">Copy</button>
            </div>
          </div>

          <div className="bg-bg.card rounded-xl p-4 border border-slate-800">
            <h2 className="text-sm font-semibold mb-2">Performance</h2>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <div className="text-slate-400 mb-1">MEMORY</div>
                <div>{memoryDisplay}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">CPU</div>
                <div>{cpuDisplay}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">STORAGE</div>
                <div>–</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">PLAYERS</div>
                <div>–</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">TPS</div>
                <div>–</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-bg.card rounded-xl border border-slate-800 flex flex-col h-[420px]">
        <div className="border-b border-slate-800 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <button
              className={`pb-1 ${
                activeTab === "console"
                  ? "text-accent.green border-b-2 border-accent.green"
                  : "text-slate-400"
              }`}
              onClick={() => setActiveTab("console")}
            >
              Console
            </button>
            <button
              className={`pb-1 ${
                activeTab === "files"
                  ? "text-accent.blue border-b-2 border-accent.blue"
                  : "text-slate-400"
              }`}
              onClick={() => setActiveTab("files")}
            >
              Files
            </button>
          </div>
        </div>
        {activeTab === "console" ? (
          <>
            <div
              ref={consoleRef}
              className="flex-1 bg-black font-mono text-xs text-slate-200 p-3 overflow-y-auto"
            >
              {consoleLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
            <div className="border-t border-slate-800 px-3 py-2 flex items-center gap-2">
              <input
                placeholder="Enter command..."
                className="flex-1 bg-slate-900/80 rounded-lg px-3 py-1.5 text-xs border border-slate-700"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="px-3 py-1.5 rounded-lg bg-accent.green text-xs text-black"
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 border-r border-slate-800 flex flex-col">
              <div className="px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate">{currentPath}</span>
                <label className="px-2 py-1 bg-slate-800 rounded cursor-pointer">
                  Upload
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto text-xs">
                {items.map((item) => (
                  <div
                    key={item.name}
                    className="px-3 py-1.5 hover:bg-slate-900/70 cursor-pointer flex justify-between"
                    onClick={() => {
                      if (item.isDirectory) {
                        const next =
                          currentPath === "/"
                            ? `/${item.name}`
                            : `${currentPath.replace(/\/$/, "")}/${item.name}`;
                        loadDirectory(next);
                      } else {
                        const filePath =
                          currentPath === "/"
                            ? `/${item.name}`
                            : `${currentPath.replace(/\/$/, "")}/${item.name}`;
                        openFile(filePath);
                      }
                    }}
                  >
                    <span className="truncate">
                      {item.isDirectory ? "📁" : "📄"} {item.name}
                    </span>
                    <span className="text-slate-500 ml-2">
                      {item.isDirectory ? "" : `${(item.size / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-800">
                {selectedFile || "No file selected"}
              </div>
              <textarea
                className="flex-1 bg-slate-950 text-xs text-slate-100 p-3 font-mono outline-none border-0"
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
              />
              <div className="border-t border-slate-800 px-3 py-2 flex justify-end">
                <button
                  className="px-3 py-1.5 rounded-lg bg-accent.green text-xs text-black"
                  onClick={saveFile}
                  disabled={!selectedFile}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

