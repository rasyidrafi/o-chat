import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import { X } from "../Icons";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { themes } from "@/constants/themes";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmVariant?: "primary" | "destructive";
  cancelText?: string;
  onCancel?: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirm",
  confirmVariant = "primary",
  cancelText = "Cancel",
  onCancel,
}) => {
  // Get animationsDisabled from settings context
  const { settings } = useSettingsContext();
  const animationsDisabled = settings.animationsDisabled;

  const handleCancelClick = onCancel || onClose;

  return (
    <AnimatePresence>
      {Boolean(isOpen) ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationsDisabled ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{
              duration: animationsDisabled ? 0 : 0.2,
              ease: "easeOut",
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-lg shadow-md border-1 overflow-hidden ${themes.sidebar.bg} ${themes.sidebar.border}`}
          >
            {/* Header with title and close button */}
            <div className={`p-6 border-b ${themes.sidebar.border}`}>
              <div className="flex items-center justify-between">
                <h2
                  className={`text-xl font-semibold ${themes.sidebar.fgHoverAsFg}`}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${themes.sidebar.fg} ${themes.sidebar.fgHover}`}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className={`text-sm mb-6 ${themes.sidebar.fg}`}>
                {children}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-lg w-full sm:w-auto cursor-pointer text-sm border-1 border-hidden ${themes.special.bgGradient} ${themes.special.bgHover} ${themes.special.fg}`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={() => {
                    handleCancelClick();
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-lg w-full sm:w-auto cursor-pointer text-sm border-1 ${themes.sidebar.bg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.sidebar.fgHover} ${themes.sidebar.border}`}
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div></div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
