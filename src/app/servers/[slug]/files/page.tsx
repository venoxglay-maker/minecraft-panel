'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, X, Loader2 } from 'lucide-react';
import { FileEditor } from '@/components/FileEditor';
import { cn } from '@/lib/utils';

type DirEntry = { name: string; path: string; type: 'folder' | 'file' };

export default function ServerFilesPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [rootEntries, setRootEntries] = useState<DirEntry[]>([]);
  const [childrenByPath, setChildrenByPath] = useState<Record<string, DirEntry[]>>({});
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (path: string) => {
    const key = path || '__root__';
    setLoadingPath(key);
    setLoadError(null);
    try {
      const url = `/api/servers/${slug}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Laden fehlgeschlagen');
      }
      const data = await res.json();
      if (data.type === 'dir') {
        const list = (data.entries || []) as DirEntry[];
        if (path) setChildrenByPath((prev) => ({ ...prev, [path]: list }));
        else setRootEntries(list);
      }
      if (data.type === 'file') {
        setEditingFile({ path: data.path || path, content: data.content ?? '' });
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoadingPath(null);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchEntries('');
  }, [slug, fetchEntries]);

  const toggleFolder = useCallback((path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    if (!childrenByPath[path]) fetchEntries(path);
  }, [childrenByPath, fetchEntries]);

  const handleEntryClick = useCallback((entry: DirEntry) => {
    if (entry.type === 'folder') {
      toggleFolder(entry.path);
      return;
    }
    fetchEntries(entry.path);
  }, [toggleFolder, fetchEntries]);

  const handleCloseEditor = useCallback(() => setEditingFile(null), []);
  const handleSavedContent = useCallback((_path: string, _newContent: string) => {
    setEditingFile((prev) => prev ? { ...prev, content: _newContent } : null);
  }, []);

  function renderEntries(entries: DirEntry[], depth: number) {
    return entries.map((entry) => {
      const isFolder = entry.type === 'folder';
      const isOpen = openFolders.has(entry.path);
      const children = childrenByPath[entry.path];
      const hasChildren = isFolder && (children?.length !== undefined);

      return (
        <div key={entry.path} className="select-none">
          <button
            type="button"
            onClick={() => handleEntryClick(entry)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              'hover:bg-panel-border/50',
              editingFile?.path === entry.path && 'bg-panel-accent/20 text-amber-200'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isFolder ? (
              <>
                <span className="flex h-4 w-4 items-center justify-center text-panel-muted">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                {isOpen ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                )}
              </>
            ) : (
              <>
                <span className="w-4" />
                <FileText className="h-4 w-4 shrink-0 text-panel-blue" />
              </>
            )}
            <span className="truncate">{entry.name}</span>
          </button>
          {isFolder && isOpen && hasChildren && (
            <div>{renderEntries(children!, depth + 1)}</div>
          )}
          {isFolder && isOpen && loadingPath === entry.path && (
            <div className="flex items-center gap-2 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
              <Loader2 className="h-4 w-4 animate-spin text-panel-muted" />
              <span className="text-xs text-panel-muted">Laden…</span>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col p-8">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-white">Files</h2>
        <p className="text-sm text-panel-muted">
          Echte Server-Dateien. Ordner öffnen, Datei anklicken zum Bearbeiten und Speichern.
        </p>
      </div>
      {loadError && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {loadError}
        </div>
      )}
      <div className="flex flex-1 min-h-0 gap-4">
        <div className="w-72 shrink-0 overflow-auto rounded-xl border border-panel-border bg-panel-card p-2">
          {loadingPath === '__root__' ? (
            <div className="flex items-center gap-2 p-2 text-panel-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Laden…</span>
            </div>
          ) : (
            renderEntries(rootEntries, 0)
          )}
        </div>
        <div className="flex flex-1 min-w-0 items-center justify-center rounded-xl border border-panel-border bg-panel-card p-8 text-panel-muted">
          <p className="text-sm text-center">
            {editingFile ? '' : 'Ordner öffnen oder Datei wählen zum Bearbeiten. Änderungen mit „Speichern“ übernehmen.'}
          </p>
        </div>
      </div>

      {editingFile && (
        <div
          className="file-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && handleCloseEditor()}
        >
          <div
            className="file-modal-content flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-panel-border bg-panel-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-panel-border px-4 py-2">
              <span className="font-mono text-sm text-white">{editingFile.path}</span>
              <button
                type="button"
                onClick={handleCloseEditor}
                className="rounded p-2 text-panel-muted hover:bg-panel-border hover:text-white"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <FileEditor
                filename={editingFile.path.split('/').pop() ?? editingFile.path}
                filePath={editingFile.path}
                initialContent={editingFile.content}
                serverSlug={slug}
                onClose={handleCloseEditor}
                onSaved={(content) => handleSavedContent(editingFile.path, content)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
