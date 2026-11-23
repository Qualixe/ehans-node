'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * glowy's description editor (data-rte): a contenteditable area with a small toolbar and an
 * HTML source view. The API sanitizes whatever it receives, so this is a convenience only.
 */
export function RichTextEditor({
  value,
  onChange,
  labelId,
  disabled = false,
}: {
  value: string;
  onChange: (html: string) => void;
  labelId: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState(false);

  // the editable area owns its DOM: seed it once, then read changes from it
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !source) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when switching back from source
  }, [source]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };

  const btn = 'rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-ink-700 disabled:opacity-50';
  return (
    <div className="overflow-hidden rounded-xl border border-ink-600 focus-within:border-slate-300">
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-ink-600 bg-ink-800 px-2 py-1.5"
        role="toolbar"
        aria-label="Formatting"
      >
        <select
          className="rounded-md bg-transparent px-1.5 py-1 text-xs text-slate-300 hover:bg-ink-700"
          aria-label="Text style"
          disabled={source || disabled}
          defaultValue="p"
          onChange={(e) => {
            exec('formatBlock', e.target.value);
            e.target.value = 'p';
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className="mx-1 h-5 w-px bg-ink-600"></span>
        {(
          [
            ['bold', 'B', 'font-bold'],
            ['italic', 'I', 'italic'],
            ['underline', 'U', 'underline'],
          ] as const
        ).map(([command, label, style]) => (
          <button
            key={command}
            type="button"
            className={`grid size-7 place-items-center rounded-md text-sm text-slate-300 hover:bg-ink-700 disabled:opacity-50 ${style}`}
            title={command.charAt(0).toUpperCase() + command.slice(1)}
            disabled={source || disabled}
            onClick={() => exec(command)}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-ink-600"></span>
        <button
          type="button"
          className={btn}
          title="Bulleted list"
          disabled={source || disabled}
          onClick={() => exec('insertUnorderedList')}
        >
          • List
        </button>
        <button
          type="button"
          className={btn}
          title="Numbered list"
          disabled={source || disabled}
          onClick={() => exec('insertOrderedList')}
        >
          1. List
        </button>
        <button
          type="button"
          className={btn}
          title="Insert link"
          disabled={source || disabled}
          onClick={() => {
            const url = window.prompt('Link address (https://…)');
            if (url) exec('createLink', url);
          }}
        >
          Link
        </button>
        <button
          type="button"
          className={btn}
          title="Clear formatting"
          disabled={source || disabled}
          onClick={() => exec('removeFormat')}
        >
          Clear
        </button>
        <button
          type="button"
          className="ml-auto rounded-md px-2 py-1 font-mono text-xs text-slate-400 hover:bg-ink-700"
          title="Edit HTML"
          aria-pressed={source}
          disabled={disabled}
          onClick={() => setSource((s) => !s)}
        >
          &lt;/&gt;
        </button>
      </div>
      {source ? (
        <textarea
          className="block min-h-48 w-full bg-ink-900 px-4 py-3 font-mono text-xs leading-5 text-slate-200 outline-none"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-labelledby={labelId}
        />
      ) : (
        <div
          ref={ref}
          className="prose-admin min-h-48 px-4 py-3 text-sm leading-6 text-slate-200 outline-none"
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          data-placeholder="Describe the product: material, size, what's in the box…"
          onInput={() => onChange(ref.current?.innerHTML ?? '')}
          onPaste={(e) => {
            // paste as plain text so Word/Google Docs styling does not leak in
            e.preventDefault();
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
          }}
        />
      )}
    </div>
  );
}
