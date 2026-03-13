'use client';

import { useState, useCallback } from 'react';
import { Save, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type FileEditorProps = {
  filename: string;
  initialContent: string;
  serverSlug: string;
  onClose?: () => void;
  onSaved?: (content: string) => void;
};

export function FileEditor({ filename, initialContent, serverSlug, onClose, onSaved }: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const isDirty = content !== initialContent;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/servers/${serverSlug}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filename, content }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setSaveStatus('success');
      onSaved?.(content);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [serverSlug, filename, content]);

  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;
  const ext = filename.split('.').pop() ?? '';

  return (
    <div className="rounded-xl border border-panel-border bg-panel-card">
      <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-white">{filename}</span>
          <span className="text-xs text-panel-muted uppercase">
            {ext} · {lineCount} lines, {charCount} characters
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1 text-sm text-panel-green">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-panel-red">Save failed</span>
          )}
          <span className="text-xs text-panel-muted">Ctrl+S to save</span>
          <button
            type="button"
            onClick={() => (onClose ? onClose() : setContent(initialContent))}
            className="rounded border border-panel-border px-3 py-1.5 text-sm text-panel-muted hover:bg-panel-border/50 hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium',
              isDirty && !saving
                ? 'bg-panel-accent text-white hover:bg-panel-accent-hover'
                : 'cursor-not-allowed bg-panel-border/50 text-panel-muted'
            )}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex font-mono text-sm">
          <div className="select-none border-r border-panel-border bg-panel-bg/80 py-2 pl-4 pr-4 text-right text-panel-muted">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSaved(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
            spellCheck={false}
            className="min-h-[400px] flex-1 resize-y bg-panel-bg px-4 py-2 text-white outline-none"
            style={{ caretColor: 'white' }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-panel-border px-4 py-2 text-xs text-panel-muted">
        <span className="uppercase">{ext}</span>
        <span>
          {lineCount} lines, {charCount} characters
        </span>
      </div>
    </div>
  );
}
