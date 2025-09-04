import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { X } from '../Icons';
import { useSettingsContext } from '../../contexts/SettingsContext';

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
    // Get animationsDisabled from settings context
    const { settings } = useSettingsContext();
    const animationsDisabled = settings.animationsDisabled;
    
    const handleCancelClick = onCancel || onClose;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: animationsDisabled ? 0 : 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: animationsDisabled ? 0 : 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    >
                        {/* Header with title and close button */}
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    aria-label="Close dialog"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                                {children}
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row-reverse gap-3">
                                <Button onClick={onConfirm} variant={confirmVariant} className="w-full sm:w-auto">
                                    {confirmText}
                                </Button>
                                <Button onClick={handleCancelClick} variant="secondary" className="w-full sm:w-auto">
                                    {cancelText}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationDialog;