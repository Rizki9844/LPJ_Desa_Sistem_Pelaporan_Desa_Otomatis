import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, FileDown, Loader2, ChevronDown } from 'lucide-react';

/**
 * Reusable export dropdown with Excel/Word/PDF options.
 * 
 * @param {Object} props
 * @param {Function} props.onExportExcel - Async handler for Excel export
 * @param {Function} props.onExportWord  - Async handler for Word export
 * @param {Function} [props.onExportPdf] - Async handler for PDF export
 * @param {string}  [props.label]        - Button label (default: "Export")
 * @param {string}  [props.variant]      - "primary" | "outline" | "ghost" | "header" (style variant)
 * @param {string}  [props.size]         - "sm" | "md" (button size)
 * @param {boolean} [props.disabled]     - Disabled state
 * @param {boolean} [props.iconOnly]     - Show only icon, no label text
 */
export default function ExportDropdown({
    onExportExcel,
    onExportWord,
    onExportPdf,
    label = 'Export',
    variant = 'outline',
    size = 'sm',
    disabled = false,
    iconOnly = false,
}) {
    const [open, setOpen] = useState(false);
    const [exporting, setExporting] = useState(null); // 'excel' | 'word' | 'pdf'
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const handleExport = async (type) => {
        setExporting(type);
        try {
            if (type === 'excel' && onExportExcel) await onExportExcel();
            if (type === 'word' && onExportWord) await onExportWord();
            if (type === 'pdf' && onExportPdf) await onExportPdf();
        } catch (err) {
            console.error(`Export ${type} failed:`, err);
            alert(`Gagal mengekspor ${type.toUpperCase()}: ${err.message}`);
        } finally {
            setExporting(null);
            setOpen(false);
        }
    };

    const isLoading = !!exporting;

    const btnClass = `btn btn-${variant} btn-${size}`;

    return (
        <div className="export-dropdown" ref={ref} style={{ position: 'relative' }}>
            <button
                className={btnClass}
                onClick={() => setOpen(!open)}
                disabled={disabled || isLoading}
                style={variant === 'header' ? {
                    background: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                } : undefined}
            >
                {isLoading ? (
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                    <Download size={15} />
                )}
                {!iconOnly && <span>{label}</span>}
                <ChevronDown size={13} style={{
                    transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    marginLeft: iconOnly ? '0' : '2px',
                    opacity: 0.7,
                }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="export-dropdown-menu"
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                    >
                        <button
                            className="export-dropdown-item"
                            onClick={() => handleExport('excel')}
                            disabled={isLoading}
                        >
                            {exporting === 'excel' ? (
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-500)' }} />
                            ) : (
                                <FileSpreadsheet size={16} style={{ color: '#10b981' }} />
                            )}
                            <div className="export-dropdown-item-text">
                                <span className="export-dropdown-item-label">Excel (.xlsx)</span>
                                <span className="export-dropdown-item-desc">Spreadsheet format</span>
                            </div>
                        </button>
                        <div className="export-dropdown-divider" />
                        <button
                            className="export-dropdown-item"
                            onClick={() => handleExport('word')}
                            disabled={isLoading}
                        >
                            {exporting === 'word' ? (
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-500)' }} />
                            ) : (
                                <FileText size={16} style={{ color: '#3b82f6' }} />
                            )}
                            <div className="export-dropdown-item-text">
                                <span className="export-dropdown-item-label">Word (.docx)</span>
                                <span className="export-dropdown-item-desc">Document format</span>
                            </div>
                        </button>
                        {onExportPdf && (
                            <>
                                <div className="export-dropdown-divider" />
                                <button
                                    className="export-dropdown-item"
                                    onClick={() => handleExport('pdf')}
                                    disabled={isLoading}
                                >
                                    {exporting === 'pdf' ? (
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-500)' }} />
                                    ) : (
                                        <FileDown size={16} style={{ color: '#ef4444' }} />
                                    )}
                                    <div className="export-dropdown-item-text">
                                        <span className="export-dropdown-item-label">PDF (.pdf)</span>
                                        <span className="export-dropdown-item-desc">Portable document</span>
                                    </div>
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
