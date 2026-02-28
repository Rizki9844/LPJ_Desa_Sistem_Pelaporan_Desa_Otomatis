import { motion } from 'framer-motion';
import { ClipboardList, ArrowLeft, ChevronRight, FolderOpen, Edit2, Trash2, FolderPlus } from 'lucide-react';
import ExportDropdown from '../ui/ExportDropdown';
import NorekBadge from './NorekBadge';
import { formatRupiah, bidangStructure } from '../../data/sampleData';
import { exportBidangToExcel } from '../../utils/exportExcel';
import { exportBidangToWord } from '../../utils/exportWord';
import { exportBidangToPdf } from '../../utils/exportPdf';
import { iconMap, progressColor } from './constants';

export default function SubBidangView({
    selectedBidang,
    activities,
    villageInfo,
    bidangStats,
    subBidangStats,
    getSubBidangObjects,
    navigateBack,
    navigateToSubBidang,
    setSelectedBidang,
    setSelectedSubBidang,
    setViewAll,
    openEditSb,
    confirmDeleteSb,
    openNewSb,
    canWrite,
}) {
    const structure = bidangStructure[selectedBidang];
    if (!structure) return null;
    const Icon = iconMap[structure.icon] || ClipboardList;
    const stats = bidangStats[selectedBidang];
    const progressPct = stats.anggaran > 0 ? (stats.realisasi / stats.anggaran) * 100 : 0;
    const sbObjects = getSubBidangObjects(selectedBidang);

    return (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
            {/* Breadcrumb */}
            <div className="kegiatan-breadcrumb">
                <button className="btn btn-ghost btn-sm" onClick={navigateBack}>
                    <ArrowLeft size={16} /> Kembali
                </button>
                <div className="kegiatan-breadcrumb-path">
                    <span onClick={() => { setSelectedBidang(null); setSelectedSubBidang(null); setViewAll(false); }} style={{ cursor: 'pointer' }}>Bidang</span>
                    <ChevronRight size={14} />
                    <span className="active" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <NorekBadge norek={structure.norek} size="sm" color={structure.color} />
                        {selectedBidang}
                    </span>
                </div>
            </div>

            {/* Header Card */}
            <div className="bidang-header-card" style={{ '--bidang-color': structure.color }}>
                <div className="bidang-header-card-accent" style={{ background: `linear-gradient(135deg, ${structure.color}, ${structure.color}99)` }} />
                <div className="bidang-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="bidang-header-icon" style={{ background: `${structure.color}25`, color: 'white' }}>
                            <Icon size={28} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <NorekBadge norek={`Bidang ${structure.norek}`} size="md" color="rgba(255,255,255,0.3)" />
                            </div>
                            <h2 className="bidang-header-title">{selectedBidang}</h2>
                            <p className="bidang-header-desc">{structure.description}</p>
                        </div>
                    </div>
                    <ExportDropdown
                        label="Export Bidang"
                        variant="header"
                        onExportExcel={() => exportBidangToExcel(selectedBidang, activities, villageInfo)}
                        onExportWord={() => exportBidangToWord(selectedBidang, activities, villageInfo)}
                        onExportPdf={() => exportBidangToPdf(selectedBidang, activities, villageInfo)}
                        disabled={stats.total === 0}
                    />
                </div>
                <div className="bidang-header-stats-row">
                    <div className="bidang-header-stat">
                        <div className="bidang-header-stat-value">{stats.total}</div>
                        <div className="bidang-header-stat-label">Total Kegiatan</div>
                    </div>
                    <div className="bidang-header-stat">
                        <div className="bidang-header-stat-value">{formatRupiah(stats.anggaran)}</div>
                        <div className="bidang-header-stat-label">Total Anggaran</div>
                    </div>
                    <div className="bidang-header-stat">
                        <div className="bidang-header-stat-value">{formatRupiah(stats.realisasi)}</div>
                        <div className="bidang-header-stat-label">Realisasi</div>
                    </div>
                    <div className="bidang-header-stat">
                        <div className="bidang-header-stat-value">{progressPct.toFixed(1)}%</div>
                        <div className="bidang-header-stat-label">Penyerapan</div>
                    </div>
                </div>
            </div>

            {/* Sub Bidang Cards */}
            <div className="sub-bidang-grid">
                {sbObjects.map((sbObj, idx) => {
                    const sb = sbObj.nama;
                    const sbStats = subBidangStats[sb] || { total: 0, selesai: 0, berjalan: 0, direncanakan: 0, anggaran: 0, realisasi: 0 };
                    const sbPct = sbStats.anggaran > 0 ? (sbStats.realisasi / sbStats.anggaran) * 100 : 0;

                    return (
                        <motion.div key={sb} className="sub-bidang-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.06 }} onClick={() => navigateToSubBidang(sb)}>
                            <div className="sub-bidang-card-top">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="sub-bidang-card-icon" style={{ background: `${structure.color}15`, color: structure.color }}>
                                        <FolderOpen size={20} />
                                    </div>
                                    <NorekBadge norek={sbObj.norek} size="md" color={structure.color} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {canWrite && (
                                        <>
                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => openEditSb(sb, e)} title="Edit sub bidang">
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => confirmDeleteSb(sb, e)} title="Hapus sub bidang" style={{ color: 'var(--danger-500)' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                    <ChevronRight size={16} className="sub-bidang-arrow" />
                                </div>
                            </div>
                            <h4 className="sub-bidang-card-title">{sb}</h4>
                            <div className="sub-bidang-card-count">{sbStats.total} kegiatan</div>
                            <div className="sub-bidang-status-row">
                                {sbStats.selesai > 0 && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>{sbStats.selesai} selesai</span>}
                                {sbStats.berjalan > 0 && <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>{sbStats.berjalan} berjalan</span>}
                                {sbStats.direncanakan > 0 && <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{sbStats.direncanakan} rencana</span>}
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <div className="progress-bar" style={{ height: '5px' }}>
                                    <motion.div className={`progress-fill ${progressColor(sbPct)}`} initial={{ width: 0 }} animate={{ width: `${Math.min(sbPct, 100)}%` }} transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                                    <span>{formatRupiah(sbStats.realisasi)}</span>
                                    <span>{sbPct.toFixed(0)}%</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Add Sub Bidang Card */}
                {canWrite && (
                    <motion.div
                        className="sub-bidang-card"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + sbObjects.length * 0.06 }}
                        onClick={openNewSb}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            borderStyle: 'dashed', borderWidth: '2px', minHeight: '180px',
                            background: 'transparent', cursor: 'pointer',
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                            background: `${structure.color}12`, color: structure.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                        }}>
                            <FolderPlus size={22} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tambah Sub Bidang</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Klik untuk menambahkan</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
