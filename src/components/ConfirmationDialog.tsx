import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  // Prevent background clicks from closing or propagating incorrectly
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/65 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 font-sans text-zinc-100 z-10"
            id="aistudio-confirmation-modal"
          >
            {/* Close Button top-right */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header / Icon layout */}
            <div className="flex gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isDestructive
                    ? 'bg-rose-950/40 border border-rose-800/60 text-rose-500 animate-pulse'
                    : 'bg-zinc-800 border border-zinc-700/60 text-indigo-400'
                }`}
              >
                {isDestructive ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                  {title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-2">
                  {message}
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="mt-4 p-3 rounded-lg bg-zinc-950/40 border border-zinc-850/60 flex items-start gap-2 text-[11px] text-zinc-400 font-sans leading-relaxed">
              <span className="text-amber-500 font-bold tracking-wider shrink-0 uppercase select-none font-mono">⚠️ WARNING:</span>
              <span>This operation cannot be reversed. Proceeding will permanently modify your CRM workspace records.</span>
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800/60 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold rounded-lg text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-750"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white shadow-md ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 font-bold'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-bold'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
