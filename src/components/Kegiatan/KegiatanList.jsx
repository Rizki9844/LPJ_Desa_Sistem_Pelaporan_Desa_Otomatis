import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Plus, ClipboardList, Edit2, Trash2, Paperclip } from 'lucide-react';
import ExportDropdown from '../ui/ExportDropdown';
import NorekBadge from './NorekBadge';
import EmptyState from '../ui/EmptyState';
import { formatRupiah, formatShortDate, bidangStructure } from '../../data/sampleData';
import { exportSubBidangToExcel, exportActivityToExcel } from '../../utils/exportExcel';
import { exportSubBidangToWord, exportActivityToWord } from '../../utils/exportWord';
import { exportSubBidangToPdf, exportActivityToPdf } from '../../utils/exportPdf';
import { statusConfig, progressColor } from './constants';

export default function KegiatanList({
    activities,
    villageInfo,
    currentActivities,
    selectedBidang,
    selectedSubBidang,
    viewAll,
    filterStatus,
    setFilterStatus,
    navigateBack,
    setSelectedBidang,
    setSelectedSubBidang,
    setViewAll,
    getBidangNorek,
    getSubBidangNorek,
    openNew,
    saving,
    openEdit,
    setConfirmDeleteAct,
    attachCounts,
    canWrite,
}) {
    return (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
            {/* Breadcrumb */}
            <div className="kegiatan-breadcrumb">
                <button className="btn btn-ghost btn-sm" onClick={navigateBack}>
                    <ArrowLeft size={16} /> Kembali
                </button>
                <div className="kegiatan-breadcrumb-path">
                    <span onClick={() => { setSelectedBidang(null); setSelectedSubBidang(null); setViewAll(false); }} style={{ cursor: 'pointer' }}>Bidang</span>
                    {selectedBidang && (
                        <>
                            <ChevronRight size={14} />
                            <span onClick={() => setSelectedSubBidang(null)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <NorekBadge norek={getBidangNorek(selectedBidang)} size="sm" color={bidangStructure[selectedBidang]?.color} />
                                {selectedBidang}
                            </span>
                        </>
                    )}
                    {selectedSubBidang && (
                        <>
                            <ChevronRight size={14} />
                            <span className="active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <NorekBadge norek={getSubBidangNorek(selectedBidang, selectedSubBidang)} size="sm" color={bidangStructure[selectedBidang]?.color} />
                                {selectedSubBidang}
                            </span>
                        </>
                    )}
                    {viewAll && (
                        <>
                            <ChevronRight size={14} />
                            <span className="active">Semua Kegiatan</span>
                        </>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className={`btn ${!filterStatus ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilterStatus('')}>
                            Semua ({currentActivities.length})
                        </button>
                        {Object.entries(statusConfig).map(([key, cfg]) => {
                            const baseItems = viewAll ? activities : activities.filter(a => {
                                let match = true;
                                if (selectedBidang) match = a.bidang === selectedBidang;
                                if (selectedSubBidang) match = match && a.sub_bidang === selectedSubBidang;
                                return match;
                            });
                            const count = baseItems.filter(a => a.status === key).length;
                            return (
                                <button key={key} className={`btn ${filterStatus === key ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilterStatus(key)}>
                                    {cfg.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="page-toolbar-right" style={{ display: 'flex', gap: '8px' }}>
                    {selectedSubBidang && currentActivities.length > 0 && (
                        <ExportDropdown
                            label="Export Sub Bidang"
                            onExportExcel={() => exportSubBidangToExcel(selectedBidang, selectedSubBidang, activities, villageInfo)}
                            onExportWord={() => exportSubBidangToWord(selectedBidang, selectedSubBidang, activities, villageInfo)}
                            onExportPdf={() => exportSubBidangToPdf(selectedBidang, selectedSubBidang, activities, villageInfo)}
                        />
                    )}
                    {canWrite && (
                        <button className="btn btn-primary" onClick={openNew} disabled={saving}>
                            <Plus size={18} /> Tambah Kegiatan
                        </button>
                    )}
                </div>
            </div>

            {/* Activity Cards */}
            <div className="kegiatan-list-grid">
                {currentActivities.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <EmptyState
                            icon={ClipboardList}
                            title="Belum ada kegiatan"
                            description="Klik tombol 'Tambah Kegiatan' untuk mulai mencatat kegiatan desa"
                            actionLabel={canWrite ? "Tambah Kegiatan" : undefined}
                            onAction={canWrite ? openNew : undefined}
                        />
                    </div>
                ) : (
                    currentActivities.map((act, idx) => {
                        const cfg = statusConfig[act.status];
                        const actColor = bidangStructure[act.bidang]?.color || '#6366f1';
                        return (
                            <motion.div key={act.id} className="card kegiatan-activity-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                                <div className="kegiatan-activity-card-accent" style={{ background: actColor }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                            <NorekBadge norek={act.norek} size="md" color={actColor} />
                                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{act.nama}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <span className={`badge ${cfg.badge}`}><span className="badge-dot" />{cfg.label}</span>
                                            {viewAll && <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{act.bidang}</span>}
                                            {(attachCounts?.[act.id] || 0) > 0 && (
                                                <span className="attachment-badge">
                                                    <Paperclip size={10} />
                                                    {attachCounts[act.id]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="table-actions" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                        <ExportDropdown
                                            iconOnly
                                            size="sm"
                                            variant="ghost"
                                            onExportExcel={() => exportActivityToExcel(act, villageInfo)}
                                            onExportWord={() => exportActivityToWord(act, villageInfo)}
                                            onExportPdf={() => exportActivityToPdf(act, villageInfo)}
                                        />
                                        {canWrite && (
                                            <>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(act)}><Edit2 size={15} /></button>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDeleteAct(act.id)} style={{ color: 'var(--danger-500)' }}><Trash2 size={15} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {viewAll && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{act.sub_bidang}</span>
                                    </div>
                                )}
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Progres</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.progres}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <motion.div className={`progress-fill ${progressColor(act.progres)}`} initial={{ width: 0 }} animate={{ width: `${act.progres}%` }} transition={{ duration: 1, delay: 0.2 + idx * 0.06 }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-tertiary)' }}>Anggaran</div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRupiah(act.anggaran)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-tertiary)' }}>Realisasi</div>
                                        <div style={{ fontWeight: 600, color: 'var(--accent-500)' }}>{formatRupiah(act.realisasi)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-tertiary)' }}>Pelaksana</div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{act.pelaksana}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-tertiary)' }}>Periode</div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{formatShortDate(act.mulai)} - {formatShortDate(act.selesai)}</div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
}
