import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { X } from '../Icons';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    confirmVariant?: 'primary' | 'destructive';
    cancelText?: string;
    onCancel?: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = 'Confirm',
    confirmVariant = 'primary',
    cancelText = 'Cancel',
    onCancel,
}) => {
    const handleCancelClick = onCancel || onClose;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm p-6 bg-white dark:bg-[#212121] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800"
                    >
                         <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-pink-500">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
                            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                {children}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                            <Button onClick={onConfirm} variant={confirmVariant} className="w-full sm:w-auto">
                                {confirmText}
                            </Button>
                            <Button onClick={handleCancelClick} variant="secondary" className="w-full sm:w-auto">
                                {cancelText}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationDialog;