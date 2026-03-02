import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, TableIcon, Plus, Trash2, Loader2, Save,
} from 'lucide-react';

const PLACEHOLDER_LABELS: Record<string, string> = {
  client_name: 'Klient:in Name',
  date: 'Datum',
  therapist_name: 'Therapeut:in Name',
  invoice_number: 'Rechnungsnummer',
  amount: 'Betrag',
  duration_minutes: 'Dauer (Min.)',
  therapy_label: 'Therapieart',
  session_date: 'Sitzungsdatum',
  session_time: 'Sitzungszeit',
};

interface TemplateEditorProps {
  htmlContent: string;
  placeholders: string[];
  saving: boolean;
  onSave: (html: string) => void;
}

export default function TemplateEditor({ htmlContent, placeholders, saving, onSave }: TemplateEditorProps) {
  const [selectedPlaceholder, setSelectedPlaceholder] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        codeBlock: false,
        code: false,
        strike: false,
        horizontalRule: false,
      }),
      Underline,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: htmlContent,
  });

  // Update editor content when template changes
  useEffect(() => {
    if (editor && htmlContent !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== htmlContent) {
        editor.commands.setContent(htmlContent);
      }
    }
  }, [htmlContent, editor]);

  const insertPlaceholder = (key: string) => {
    if (!editor || !key) return;
    editor.chain().focus().insertContent(`{{${key}}}`).run();
    setSelectedPlaceholder('');
  };

  const handleSave = () => {
    if (!editor) return;
    onSave(editor.getHTML());
  };

  if (!editor) return null;

  const isInTable = editor.isActive('table');

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-50 rounded-lg p-2 border border-gray-200">
        {/* Text formatting */}
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Fett"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Kursiv"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Unterstrichen"
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Überschrift 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Überschrift 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Überschrift 3"
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Aufzählung"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Nummerierung"
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Table */}
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run()}
          title="Tabelle einfügen"
        >
          <TableIcon size={16} />
        </ToolbarButton>

        {isInTable && (
          <>
            <ToolbarButton
              active={false}
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Zeile hinzufügen"
            >
              <Plus size={14} />
              <span className="text-xs">Zeile</span>
            </ToolbarButton>
            <ToolbarButton
              active={false}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Spalte hinzufügen"
            >
              <Plus size={14} />
              <span className="text-xs">Spalte</span>
            </ToolbarButton>
            <ToolbarButton
              active={false}
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Zeile löschen"
            >
              <Trash2 size={14} />
              <span className="text-xs">Zeile</span>
            </ToolbarButton>
            <ToolbarButton
              active={false}
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Spalte löschen"
            >
              <Trash2 size={14} />
              <span className="text-xs">Spalte</span>
            </ToolbarButton>
          </>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Placeholder dropdown */}
        <select
          value={selectedPlaceholder}
          onChange={e => {
            insertPlaceholder(e.target.value);
          }}
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="">Platzhalter einfügen...</option>
          {placeholders.map(p => (
            <option key={p} value={p}>{PLACEHOLDER_LABELS[p] || p}</option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div className="tiptap-editor border border-gray-200 rounded-lg bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium cursor-pointer"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Speichern
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ active, onClick, title, children }: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center gap-0.5 p-1.5 rounded transition-colors cursor-pointer ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}
