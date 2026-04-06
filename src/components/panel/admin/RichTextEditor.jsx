import { useEffect, useRef, useState } from 'react';
import { Bold, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Quote, RemoveFormatting } from 'lucide-react';
import { sanitizeRichTextHtml } from '../../../../shared/richText.js';

const TOOLBAR_ITEMS = [
  { icon: Bold, label: 'Pogrubienie', command: 'bold' },
  { icon: Italic, label: 'Kursywa', command: 'italic' },
  { icon: Heading2, label: 'Nagłówek', command: 'formatBlock', value: 'h2' },
  { icon: List, label: 'Lista punktowana', command: 'insertUnorderedList' },
  { icon: ListOrdered, label: 'Lista numerowana', command: 'insertOrderedList' },
  { icon: Quote, label: 'Cytat', command: 'formatBlock', value: 'blockquote' },
  { icon: RemoveFormatting, label: 'Wyczyść formatowanie', command: 'removeFormat' },
];

export default function RichTextEditor({ label, value, onChange, placeholder = '' }) {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const sanitizedValue = sanitizeRichTextHtml(value);
    if (editorRef.current && editorRef.current.innerHTML !== sanitizedValue) {
      editorRef.current.innerHTML = sanitizedValue;
    }
  }, [value]);

  const syncValue = () => {
    const nextValue = sanitizeRichTextHtml(editorRef.current?.innerHTML || '');
    onChange(nextValue);
  };

  const runCommand = (command, commandValue) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const handleLink = () => {
    const href = window.prompt('Podaj adres linku', 'https://');
    if (!href) {
      return;
    }

    runCommand('createLink', href);
  };

  const isEmpty = !sanitizeRichTextHtml(value);

  return (
    <div>
      <label className="mb-2 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">{label}</label>
      <div className="overflow-hidden rounded-[24px] border border-mauve/15 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-mauve/10 px-4 py-3">
          {TOOLBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => runCommand(item.command, item.value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-mauve/10 bg-white text-mauve/65 transition hover:border-gold/30 hover:text-mauve"
                title={item.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleLink}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-mauve/10 bg-white text-mauve/65 transition hover:border-gold/30 hover:text-mauve"
            title="Dodaj link"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        <div className="relative">
          {isEmpty && !focused ? <div className="pointer-events-none absolute left-4 top-4 text-fs-body leading-7 text-mauve/35">{placeholder}</div> : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              syncValue();
            }}
            onInput={syncValue}
            className="min-h-[220px] px-4 py-4 text-fs-body leading-8 text-mauve focus:outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-gold/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:font-serif [&_h2]:text-fs-title-sm [&_h2]:text-mauve [&_h3]:font-serif [&_h3]:text-fs-body-lg [&_h3]:text-mauve [&_li]:ml-5 [&_li]:pl-1 [&_ol]:list-decimal [&_ul]:list-disc"
          />
        </div>
      </div>
      <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Możesz dodawać akapity, listy, nagłówki, cytaty, pogrubienia i linki.</p>
    </div>
  );
}