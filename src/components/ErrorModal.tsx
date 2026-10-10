import React, { useEffect } from 'react';
import { ErrorModalState } from '../types';

interface ErrorModalProps {
  modalState: ErrorModalState;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ modalState, onClose }) => {
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalState.isOpen, onClose]);

  if (!modalState.isOpen) return null;

  const isEmojiMode = modalState.image.includes('Microsoft-Fluentui-Emoji');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="relative z-10 max-w-lg w-full bg-[#161d2f]/95 border border-white/10 rounded-3xl p-8 text-center shadow-[0_25px_60px_-10px_rgba(0,0,0,0.8),0_0_40px_rgba(244,63,94,0.15)] flex flex-col items-center animate-scaleUp">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-4">
          ⚠️ Oopsie!
        </div>

        {/* Graphic */}
        <div className="my-2 flex justify-center items-center">
          <img
            src={modalState.image}
            alt="Error Graphic"
            className={`transition-transform duration-300 hover:scale-105 ${
              isEmojiMode
                ? 'w-32 h-32 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]'
                : 'w-72 max-w-full rounded-2xl border border-white/10 shadow-2xl'
            }`}
          />
        </div>

        {/* Title & Text */}
        <h3 className="text-2xl font-extrabold text-white mt-4 mb-2">
          {modalState.title}
        </h3>

        <p className="text-sm md:text-base text-slate-300 leading-relaxed bg-white/[0.04] p-3.5 rounded-xl border border-dashed border-white/15 mb-6 max-w-sm">
          {modalState.message}
        </p>

        {/* Actions */}
        <button
          type="button"
          onClick={onClose}
          className="w-full max-w-xs py-3 px-6 rounded-full font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 transition-all text-sm md:text-base"
        >
          ← Back to Upload
        </button>
      </div>
    </div>
  );
};
