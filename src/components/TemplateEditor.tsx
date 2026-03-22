import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Extension } from '@tiptap/react';
import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, TableIcon, Plus, Trash2, Loader2, Save, Eye,
  AlignLeft, AlignCenter, AlignRight, Palette, Highlighter, ImageIcon,
} from 'lucide-react';

// Custom FontSize extension using TextStyle
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize?.replace(/['"]+/g, '') || null,
          renderHTML: attrs => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },

  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: { chain: () => ReturnType<ReturnType<typeof useEditor>['chain']> }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: { chain: () => ReturnType<ReturnType<typeof useEditor>['chain']> }) =>
        chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

const FONT_SIZES = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt'];

const PLACEHOLDER_LABELS: Record<string, string> = {
  therapist_address: 'Therapeut:in Adresse (Block)',
  client_address: 'Patient:in Adresse (Block)',
  client_name: 'Patient:in Name',
  client_street: 'Patient:in Straße',
  client_zip: 'Patient:in PLZ',
  client_city: 'Patient:in Ort',
  client_country: 'Patient:in Land',
  date: 'Datum',
  therapist_name: 'Therapeut:in Name',
  therapist_street: 'Therapeut:in Straße',
  therapist_zip: 'Therapeut:in PLZ',
  therapist_city: 'Therapeut:in Ort',
  therapist_tax_id: 'Steuernummer',
  invoice_number: 'Rechnungsnummer',
  booking_number: 'Buchungsnummer',
  amount: 'Betrag',
  duration_minutes: 'Dauer (Min.)',
  therapy_label: 'Therapieart',
  session_date: 'Sitzungsdatum',
  session_time: 'Sitzungszeit',
  payment_note: 'Zahlungshinweis',
  bank_account_holder: 'Kontoinhaber:in',
  bank_iban: 'IBAN',
  bank_bic: 'BIC',
  bank_name: 'Bankname',
};

interface TemplateEditorProps {
  htmlContent: string;
  placeholders: string[];
  saving: boolean;
  previewing: boolean;
  onSave: (html: string) => void;
  onPreview: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  hideActions?: boolean;
}

export interface TemplateEditorHandle {
  getHTML: () => string;
}

const TemplateEditor = forwardRef<TemplateEditorHandle, TemplateEditorProps>(function TemplateEditor({ htmlContent, placeholders, saving, previewing, onSave, onPreview, onUploadImage, hideActions }, ref) {
  const [selectedPlaceholder, setSelectedPlaceholder] = useState('');
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const imagePanelRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLInputElement>(null);
  const highlightColorRef = useRef<HTMLInputElement>(null);

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
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
      FontSize,
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

  // Close image panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (imagePanelRef.current && !imagePanelRef.current.contains(e.target as Node)) {
        setShowImagePanel(false);
      }
    };
    if (showImagePanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showImagePanel]);

  const insertPlaceholder = (key: string) => {
    if (!editor || !key) return;
    editor.chain().focus().insertContent(`{{${key}}}`).run();
    setSelectedPlaceholder('');
  };

  const insertImageFromUrl = () => {
    if (!editor || !imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setImageUrl('');
    setShowImagePanel(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setImageUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
      setShowImagePanel(false);
    } catch {
      // Error is handled by parent hook
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (!editor) return;
    onSave(editor.getHTML());
  };

  const handlePreview = () => {
    if (!editor) return;
    onPreview(editor.getHTML());
  };

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? '',
  }), [editor]);

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

        {/* Alignment */}
        <ToolbarButton
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Linksbündig"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Zentriert"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Rechtsbündig"
        >
          <AlignRight size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text color */}
        <ToolbarButton
          active={false}
          onClick={() => textColorRef.current?.click()}
          title="Textfarbe"
        >
          <Palette size={16} />
          <input
            ref={textColorRef}
            type="color"
            className="sr-only"
            value={editor.getAttributes('textStyle').color || '#000000'}
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
          />
        </ToolbarButton>

        {/* Highlight */}
        <ToolbarButton
          active={editor.isActive('highlight')}
          onClick={() => highlightColorRef.current?.click()}
          title="Hervorheben"
        >
          <Highlighter size={16} />
          <input
            ref={highlightColorRef}
            type="color"
            className="sr-only"
            value="#ffff00"
            onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Font size */}
        <select
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={e => {
            if (e.target.value) {
              editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
            } else {
              editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
            }
          }}
          className="text-sm border border-gray-300 rounded px-1.5 py-1 bg-white"
          title="Schriftgröße"
        >
          <option value="">Größe</option>
          {FONT_SIZES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

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

        {/* Image */}
        <div className="relative" ref={imagePanelRef}>
          <ToolbarButton
            active={showImagePanel}
            onClick={() => setShowImagePanel(!showImagePanel)}
            title="Bild einfügen"
          >
            <ImageIcon size={16} />
          </ToolbarButton>

          {showImagePanel && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-72">
              <div className="space-y-3">
                {/* URL tab */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Bild-URL</label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                      onKeyDown={e => e.key === 'Enter' && insertImageFromUrl()}
                    />
                    <button
                      onClick={insertImageFromUrl}
                      disabled={!imageUrl.trim()}
                      className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-teal-600 disabled:opacity-50 cursor-pointer"
                    >
                      Einfügen
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* Upload tab */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Datei hochladen</label>
                  <label className="flex items-center gap-2 text-sm text-primary hover:text-teal-600 cursor-pointer">
                    {imageUploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    {imageUploading ? 'Wird hochgeladen...' : 'Bild auswählen (max. 2 MB)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="sr-only"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

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

      {/* Actions */}
      {!hideActions && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium cursor-pointer"
          >
            {previewing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
            Vorschau
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Speichern
          </button>
        </div>
      )}
    </div>
  );
});

export default TemplateEditor;

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
