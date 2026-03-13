'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, X } from 'lucide-react';
import { FileEditor } from '@/components/FileEditor';
import { getMockFileTree, type FileNode } from '@/lib/fileTree';
import { cn } from '@/lib/utils';

export default function ServerFilesPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [tree] = useState<FileNode[]>(() => getMockFileTree());
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['config']));
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [contentByPath, setContentByPath] = useState<Record<string, string>>({});

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleFileClick = useCallback((node: FileNode) => {
    if (node.type === 'folder') {
      toggleFolder(node.path);
      return;
    }
    const content = contentByPath[node.path] ?? node.content ?? '';
    setEditingFile({ path: node.path, content });
  }, [contentByPath]);

  const handleCloseEditor = useCallback(() => {
    setEditingFile(null);
  }, []);

  const handleSavedContent = useCallback((path: string, newContent: string) => {
    setContentByPath((prev) => ({ ...prev, [path]: newContent }));
    setEditingFile((prev) => (prev && prev.path === path ? { ...prev, content: newContent } : prev));
  }, []);

  function renderNode(node: FileNode, depth: number) {
    const isFolder = node.type === 'folder';
    const isOpen = openFolders.has(node.path);
    const hasChildren = isFolder && node.children && node.children.length > 0;

    return (
      <div key={node.path} className="select-none">
        <button
          type="button"
          onClick={() => handleFileClick(node)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            'hover:bg-panel-border/50',
            editingFile?.path === node.path && 'bg-panel-accent/20 text-amber-200'
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
          <span className="truncate">{node.name}</span>
        </button>
        {isFolder && isOpen && hasChildren && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col p-8">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-white">Files</h2>
        <p className="text-sm text-panel-muted">
          Ordner und Dateien des Servers. Klicke eine Datei zum Bearbeiten; Änderungen mit Save speichern.
        </p>
      </div>
      <div className="flex flex-1 min-h-0 gap-4">
        <div className="w-72 shrink-0 overflow-auto rounded-xl border border-panel-border bg-panel-card p-2">
          {tree.map((node) => renderNode(node, 0))}
        </div>
        <div className="flex flex-1 min-w-0 items-center justify-center rounded-xl border border-panel-border bg-panel-card p-8 text-panel-muted">
          <p className="text-sm">Klicke links auf eine Datei – es öffnet sich ein Fenster zum Bearbeiten und Speichern.</p>
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
