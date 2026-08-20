import { useState } from 'react';

export default function Modal({ isOpen = true, onClose, title, children, size = 'md' }) {
  if (isOpen === false) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-[95%] sm:w-full ${sizes[size]} max-h-[92vh] flex flex-col overflow-hidden my-auto z-10 animate-in fade-in zoom-in-95 duration-150`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none transition-colors">&times;</button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
