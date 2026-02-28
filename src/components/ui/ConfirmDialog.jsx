import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Reusable confirmation dialog with animation.
 *
 * @param {boolean}  open         - Whether the dialog is visible
 * @param {Function} onClose      - Called when user cancels / clicks overlay
 * @param {Function} onConfirm    - Called when user confirms
 * @param {string}   title        - Dialog heading
 * @param {string}   message      - Body text
 * @param {string}   confirmText  - Label for confirm button (default "Hapus")
 * @param {string}   cancelText   - Label for cancel button  (default "Batal")
 * @param {string}   variant      - "danger" | "warning" (default "danger")
 * @param {boolean}  loading      - Show spinner on confirm button
 */
export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Konfirmasi Hapus',
    message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText = 'Hapus',
    cancelText = 'Batal',
    variant = 'danger',
    loading = false,
}) {
    const isDanger = variant === 'danger';
    const iconBg = isDanger ? 'var(--danger-50)' : 'var(--warning-50)';
    const iconColor = isDanger ? 'var(--danger-500)' : 'var(--warning-500)';
    const btnBg = isDanger ? 'var(--danger-500)' : 'var(--warning-500)';
    const btnHover = isDanger ? 'var(--danger-600)' : 'var(--warning-600)';
    const Icon = isDanger ? Trash2 : AlertTriangle;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="confirm-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="confirm-dialog"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button className="confirm-close" onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </button>

                        {/* Icon */}
                        <div className="confirm-icon" style={{ background: iconBg }}>
                            <Icon size={28} style={{ color: iconColor }} />
                        </div>

                        {/* Content */}
                        <h3 className="confirm-title">{title}</h3>
                        <p className="confirm-message">{message}</p>

                        {/* Actions */}
                        <div className="confirm-actions">
                            <button
                                className="btn confirm-btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                {cancelText}
                            </button>
                            <button
                                className="btn confirm-btn-confirm"
                                style={{ '--btn-bg': btnBg, '--btn-hover': btnHover }}
                                onClick={onConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="confirm-spinner" />
                                ) : (
                                    <Icon size={16} />
                                )}
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
