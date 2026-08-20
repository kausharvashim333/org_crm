import { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, Image as ImageIcon, FileCheck } from 'lucide-react';

export default function FilePreviewBox({ file, onRemove, label = 'Uploaded File' }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setIsImage(false);
      return;
    }

    if (typeof file === 'string') {
      setPreviewUrl(file);
      setIsImage(file.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) !== null);
      return;
    }

    if (file instanceof File) {
      if (file.type.startsWith('image/')) {
        setIsImage(true);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setIsImage(false);
        setPreviewUrl(null);
      }
    }
  }, [file]);

  if (!file) return null;

  const fileName = typeof file === 'string' ? file.split('/').pop() : file.name;
  const fileSize = file instanceof File ? `${(file.size / 1024).toFixed(1)} KB` : null;

  return (
    <div className="mt-2.5 p-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        {isImage && previewUrl ? (
          <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-indigo-300 flex-shrink-0 bg-white shadow-2xs">
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              title="View full image"
            >
              <Eye className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="w-11 h-11 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        )}

        <div className="min-w-0">
          <p className="font-bold text-slate-800 text-xs truncate flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{fileName}</span>
          </p>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {isImage ? '📷 Image File' : '📄 Document'} {fileSize ? `• ${fileSize}` : ''}
          </p>
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Remove File"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
