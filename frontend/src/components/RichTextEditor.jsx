import { useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Image, Quote, Code } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder, rows = 3 }) {
  const editorRef = useRef(null);

  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        exec('insertImage', ev.target.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const btnClass = "p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors";

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
        <button type="button" onClick={() => exec('bold')} className={btnClass} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => exec('italic')} className={btnClass} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => exec('underline')} className={btnClass} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass} title="Bullet List"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass} title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={() => exec('formatBlock', 'blockquote')} className={btnClass} title="Quote"><Quote className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => exec('formatBlock', 'pre')} className={btnClass} title="Code Block"><Code className="w-3.5 h-3.5" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={handleImage} className={btnClass} title="Insert Image"><Image className="w-3.5 h-3.5" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className="px-3 py-2 text-sm outline-none prose prose-sm max-w-none"
        style={{ minHeight: `${rows * 1.5}rem` }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    </div>
  );
}
