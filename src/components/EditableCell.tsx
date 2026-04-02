import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface EditableCellProps {
  value: string | number | null;
  onSave: (value: string) => void;
  className?: string;
  type?: 'text' | 'number';
}

export function EditableCell({ value, onSave, className = '', type = 'text' }: EditableCellProps) {
  const { editMode } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editMode) {
    return <span className={className}>{value ?? '—'}</span>;
  }

  if (!editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-primary/10 px-1 rounded ${className}`}
        onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
      >
        {value ?? '—'}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { onSave(draft); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      className="bg-secondary border border-primary rounded px-1 py-0.5 text-sm text-foreground w-20 outline-none"
    />
  );
}
