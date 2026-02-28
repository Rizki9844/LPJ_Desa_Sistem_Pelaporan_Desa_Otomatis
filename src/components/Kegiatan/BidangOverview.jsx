import { motion } from 'framer-motion';
import { ClipboardList, ChevronRight, LayoutGrid } from 'lucide-react';
import ExportDropdown from '../ui/ExportDropdown';
import NorekBadge from './NorekBadge';
import { formatRupiah, budgetCategories, bidangStructure } from '../../data/sampleData';
import { exportBidangToExcel } from '../../utils/exportExcel';
import { exportBidangToWord } from '../../utils/exportWord';
import { exportBidangToPdf } from '../../utils/exportPdf';
import { iconMap, progressColor } from './constants';

export default function BidangOverview({
    activities,
    villageInfo,
    bidangStats,
    getSubBidangList,
    navigateToAll,
    navigateToBidang
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="kegiatan-top-bar">
                <div className="kegiatan-summary-strip">
                    <div className="kegiatan-summary-item">
                        <span className="kegiatan-summary-number">{activities.length}</span>
                        <span className="kegiatan-summary-label">Total Kegiatan</span>
                    </div>
                    <div className="kegiatan-summary-divider" />
                    <div className="kegiatan-summary-item">
                        <span className="kegiatan-summary-number" style={{ color: 'var(--accent-500)' }}>
                            {activities.filter(a => a.status === 'selesai').length}
                        </span>
                        <span className="kegiatan-summary-label">Selesai</span>
                    </div>
                    <div className="kegiatan-summary-divider" />
                    <div className="kegiatan-summary-item">
                        <span className="kegiatan-summary-number" style={{ color: 'var(--warning-500)' }}>
                            {activities.filter(a => a.status === 'berjalan').length}
                        </span>
                        <span className="kegiatan-summary-label">Berjalan</span>
                    </div>
                    <div className="kegiatan-summary-divider" />
                    <div className="kegiatan-summary-item">
                        <span className="kegiatan-summary-number" style={{ color: 'var(--info-500)' }}>
                            {activities.filter(a => a.status === 'direncanakan').length}
                        </span>
                        <span className="kegiatan-summary-label">Direncanakan</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {activities.length > 0 && (
                        <ExportDropdown
                            label="Export"
                            size="sm"
                            variant="outline"
                            onExportExcel={() => exportBidangToExcel('Semua Bidang', activities, villageInfo)}
                            onExportWord={() => exportBidangToWord('Semua Bidang', activities, villageInfo)}
                            onExportPdf={() => exportBidangToPdf('Semua Bidang', activities, villageInfo)}
                        />
                    )}
                    <button className="btn btn-outline btn-sm" onClick={navigateToAll}>
                        <LayoutGrid size={16} /> Lihat Semua
                    </button>
                </div>
            </div>

            <div className="bidang-grid">
                {budgetCategories.map((bidangName, idx) => {
                    const structure = bidangStructure[bidangName];
                    const stats = bidangStats[bidangName];
                    const Icon = iconMap[structure.icon] || ClipboardList;
                    const progressPct = stats.anggaran > 0 ? (stats.realisasi / stats.anggaran) * 100 : 0;
                    const sbCount = getSubBidangList(bidangName).length;

                    return (
                        <motion.div key={bidangName} className="bidang-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07, duration: 0.4 }} onClick={() => navigateToBidang(bidangName)} style={{ '--bidang-color': structure.color }}>
                            <div className="bidang-card-accent" style={{ background: structure.color }} />
                            <div className="bidang-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="bidang-card-icon" style={{ background: `${structure.color}18`, color: structure.color }}>
                                        <Icon size={24} />
                                    </div>
                                    <NorekBadge norek={structure.norek} size="lg" color={structure.color} />
                                </div>
                                <ChevronRight size={18} className="bidang-card-arrow" />
                            </div>
                            <h3 className="bidang-card-title">{bidangName}</h3>
                            <p className="bidang-card-desc">{structure.description}</p>
                            <div className="bidang-card-stats">
                                <div className="bidang-card-stat">
                                    <span className="bidang-card-stat-value">{sbCount}</span>
                                    <span className="bidang-card-stat-label">Sub Bidang</span>
                                </div>
                                <div className="bidang-card-stat">
                                    <span className="bidang-card-stat-value">{stats.total}</span>
                                    <span className="bidang-card-stat-label">Kegiatan</span>
                                </div>
                                <div className="bidang-card-stat">
                                    <span className="bidang-card-stat-value" style={{ color: 'var(--accent-500)' }}>{stats.selesai}</span>
                                    <span className="bidang-card-stat-label">Selesai</span>
                                </div>
                                <div className="bidang-card-stat">
                                    <span className="bidang-card-stat-value" style={{ color: 'var(--warning-500)' }}>{stats.berjalan}</span>
                                    <span className="bidang-card-stat-label">Berjalan</span>
                                </div>
                            </div>
                            <div style={{ marginTop: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-tertiary)' }}>Realisasi Anggaran</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progressPct.toFixed(0)}%</span>
                                </div>
                                <div className="progress-bar" style={{ height: '6px' }}>
                                    <motion.div className={`progress-fill ${progressColor(progressPct)}`} initial={{ width: 0 }} animate={{ width: `${Math.min(progressPct, 100)}%` }} transition={{ duration: 1, delay: 0.3 + idx * 0.1 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', color: 'var(--text-tertiary)' }}>
                                    <span>{formatRupiah(stats.realisasi)}</span>
                                    <span>{formatRupiah(stats.anggaran)}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
