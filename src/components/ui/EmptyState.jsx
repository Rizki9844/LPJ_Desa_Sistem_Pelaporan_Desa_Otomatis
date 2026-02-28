import { motion } from 'framer-motion';

export default function EmptyState({
    icon: Icon,
    title = 'Tidak ada data',
    description = '',
    actionLabel,
    onAction,
    compact = false,
}) {
    return (
        <motion.div
            className={`empty-state-container ${compact ? 'compact' : ''}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {Icon && (
                <div className="empty-state-icon-wrapper">
                    <Icon size={compact ? 32 : 48} strokeWidth={1.2} />
                </div>
            )}
            <div className="empty-state-title">{title}</div>
            {description && <div className="empty-state-desc">{description}</div>}
            {actionLabel && onAction && (
                <button className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: '16px' }}>
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
}
