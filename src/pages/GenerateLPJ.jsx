import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileSpreadsheet, FileText, FileDown, Printer, Eye, Loader2, CheckCircle2,
    Clock, AlertCircle, Search, ChevronRight, ClipboardList,
    Landmark, HardHat, Users, Rocket, ShieldAlert, FolderOpen, AlertTriangle, Paperclip,
    BookOpen, Receipt, Package, Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { formatRupiah, formatShortDate, budgetCategories, bidangStructure } from '../data/sampleData';
import { exportToExcel, exportActivityToExcel } from '../utils/exportExcel';
import { exportToWord } from '../utils/exportWord';
import { exportLPJFisikToWord } from '../utils/exportWordFisik';
import { exportLPJNonFisikToWord } from '../utils/exportWordNonFisik';
import { exportActivityToPdf, exportAllToPdf } from '../utils/exportPdf';
import { exportBukuUtamaToWord } from '../utils/exportBukuUtama';
import { exportKuitansiToWord, exportDaftarHOKToWord } from '../utils/exportKuitansi';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import NarrativeEditor from '../components/NarrativeEditor';
import { supabase } from '../lib/supabase';
import { useRole } from '../hooks/useRole';

const iconMap = { Landmark, HardHat, Users, Rocket, ShieldAlert };

const statusConfig = {
    selesai: { label: 'Selesai', badge: 'badge-success', icon: CheckCircle2, color: 'var(--accent-500)' },
    berjalan: { label: 'Berjalan', badge: 'badge-warning', icon: Clock, color: 'var(--warning-500)' },
    direncanakan: { label: 'Direncanakan', badge: 'badge-info', icon: AlertCircle, color: 'var(--info-500)' },
};

export default function GenerateLPJ() {
    const { state, dispatch, loading: appLoading, activeTahun } = useApp();
    const { addToast } = useToast();
    const { canWrite } = useRole();

    const [exporting, setExporting] = useState(null); // 'excel-X', 'word-X', 'excel-all', 'word-all'
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBidang, setFilterBidang] = useState('');
    const [attachData, setAttachData] = useState({ kegiatan: {}, belanja: {}, belanjaTotal: 0 });

    const { villageInfo, activities, lpjNarratives, expenseItems, expenses } = state;

    // Pilar stats
    const narrativeFieldCount = useMemo(() => {
        if (!lpjNarratives || !lpjNarratives.id) return 0;
        const fields = ['kata_pengantar','latar_belakang','tujuan_lpj','dasar_hukum','realisasi_fisik_narasi','realisasi_keuangan_narasi','kendala','saran'];
        return fields.filter(f => lpjNarratives[f] && lpjNarratives[f].trim()).length;
    }, [lpjNarratives]);

    const kuitansiCount = useMemo(() => (expenseItems || []).filter(i => i.tipe === 'kuitansi').length, [expenseItems]);
    const hokCount = useMemo(() => (expenseItems || []).filter(i => i.tipe === 'hok').length, [expenseItems]);

    // Load attachment details for kegiatan + belanja
    useEffect(() => {
        async function loadAttachments() {
            try {
                const { data } = await supabase
                    .from('attachments')
                    .select('entity_id, entity_type, file_name, file_url, keterangan')
                    .eq('tahun_anggaran', activeTahun);
                if (data) {
                    const result = { kegiatan: {}, belanja: {}, belanjaTotal: 0 };
                    data.forEach(r => {
                        const type = r.entity_type;
                        if (!result[type]) result[type] = {};
                        if (!result[type][r.entity_id]) result[type][r.entity_id] = [];
                        result[type][r.entity_id].push({
                            file_name: r.file_name,
                            file_url: r.file_url || '',
                            keterangan: r.keterangan || r.file_name,
                        });
                    });
                    result.belanjaTotal = data.filter(r => r.entity_type === 'belanja').length;
                    setAttachData(result);
                }
            } catch (err) { console.error('Load attachments:', err); }
        }
        if (!appLoading) loadAttachments();
    }, [appLoading]);

    // ── Pre-export validation ──
    const exportValidation = useMemo(() => {
        const warnings = [];
        const errors = [];

        // Check village info
        if (!villageInfo.nama_desa) errors.push('Nama desa belum diisi');
        if (!villageInfo.kecamatan) warnings.push('Kecamatan belum diisi');
        if (!villageInfo.kabupaten) warnings.push('Kabupaten belum diisi');
        if (!villageInfo.provinsi) warnings.push('Provinsi belum diisi');
        if (!villageInfo.tahun_anggaran) warnings.push('Tahun anggaran belum diisi');
        if (!villageInfo.periode) warnings.push('Periode laporan belum diisi');

        // Check pejabat
        const pejabat = villageInfo.pejabat_desa || [];
        if (pejabat.length === 0) warnings.push('Belum ada pejabat desa (penandatangan)');

        // Check activities
        if (activities.length === 0) errors.push('Belum ada data kegiatan');

        const hasErrors = errors.length > 0;
        const hasWarnings = warnings.length > 0;

        return { errors, warnings, hasErrors, hasWarnings, canExport: !hasErrors };
    }, [villageInfo, activities]);

    // Filtered activities
    const filteredActivities = useMemo(() => {
        let items = activities;
        if (filterBidang) items = items.filter(a => a.bidang === filterBidang);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(a => a.nama.toLowerCase().includes(q) || a.sub_bidang.toLowerCase().includes(q));
        }
        return items;
    }, [activities, filterBidang, searchQuery]);

    // Group by bidang
    const groupedActivities = useMemo(() => {
        const grouped = {};
        filteredActivities.forEach(a => {
            if (!grouped[a.bidang]) grouped[a.bidang] = [];
            grouped[a.bidang].push(a);
        });
        return grouped;
    }, [filteredActivities]);

    // ── Per-activity export handlers ──
    const handleExportActivityExcel = async (activity) => {
        const key = `excel-${activity.id}`;
        setExporting(key);
        try {
            const fileName = exportActivityToExcel(activity, villageInfo, attachData.kegiatan?.[activity.id] || []);
            addToast(`File ${fileName} berhasil diunduh!`, 'success');
        } catch (err) {
            addToast('Gagal mengekspor: ' + err.message, 'error');
        }
        setExporting(null);
    };

    const handleExportActivityWord = async (activity) => {
        const key = `word-${activity.id}`;
        setExporting(key);
        try {
            let fileName;
            const jenis = activity.jenis_lpj || 'fisik';
            if (jenis === 'fisik') {
                fileName = await exportLPJFisikToWord(activity, villageInfo, attachData.kegiatan?.[activity.id] || []);
            } else {
                fileName = await exportLPJNonFisikToWord(activity, villageInfo, attachData.kegiatan?.[activity.id] || []);
            }
            addToast(`File ${fileName} berhasil diunduh! (LPJ ${jenis === 'fisik' ? 'Fisik' : 'Non-Fisik'} — Bundel Lengkap)`, 'success');
        } catch (err) {
            addToast('Gagal mengekspor: ' + err.message, 'error');
        }
        setExporting(null);
    };

    const handleExportActivityPdf = async (activity) => {
        const key = `pdf-${activity.id}`;
        setExporting(key);
        try {
            const fileName = await exportActivityToPdf(activity, villageInfo, attachData.kegiatan?.[activity.id] || []);
            addToast(`File ${fileName} berhasil diunduh!`, 'success');
        } catch (err) {
            addToast('Gagal mengekspor PDF: ' + err.message, 'error');
        }
        setExporting(null);
    };

    // Full LPJ export
    const handleExportAllExcel = async () => {
        setExporting('excel-all');
        try {
            const fileName = exportToExcel(state, attachData);
            addToast(`File ${fileName} berhasil diunduh!`, 'success');
        } catch (err) {
            addToast('Gagal mengekspor: ' + err.message, 'error');
        }
        setExporting(null);
    };

    const handleExportAllWord = async () => {
        setExporting('word-all');
        try {
            const fileName = await exportToWord(state, attachData);
            addToast(`File ${fileName} berhasil diunduh!`, 'success');
        } catch (err) {
            addToast('Gagal mengekspor: ' + err.message, 'error');
        }
        setExporting(null);
    };

    const handleExportAllPdf = async () => {
        setExporting('pdf-all');
        try {
            const fileName = await exportAllToPdf(state, attachData);
            addToast(`File ${fileName} berhasil diunduh!`, 'success');
        } catch (err) {
            addToast('Gagal mengekspor PDF: ' + err.message, 'error');
        }
        setExporting(null);
    };

    const handlePrint = () => {
        setShowPreview(true);
        setTimeout(() => window.print(), 500);
    };

    // ── Pilar 1: Buku Utama ──
    const handleExportBukuUtama = async () => {
        setExporting('buku-utama');
        try {
            const fileName = await exportBukuUtamaToWord(state, lpjNarratives || {});
            addToast(`Buku Utama LPJ berhasil diunduh: ${fileName}`, 'success');
        } catch (err) {
            addToast('Gagal export Buku Utama: ' + err.message, 'error');
        }
        setExporting(null);
    };

    // ── Pilar 2: Kuitansi ──
    const handleExportKuitansi = async () => {
        setExporting('kuitansi');
        try {
            const fileName = await exportKuitansiToWord(expenseItems || [], expenses || [], villageInfo);
            addToast(`Kuitansi berhasil diunduh: ${fileName}`, 'success');
        } catch (err) {
            addToast('Gagal export Kuitansi: ' + err.message, 'error');
        }
        setExporting(null);
    };

    // ── Pilar 2: HOK ──
    const handleExportHOK = async () => {
        setExporting('hok');
        try {
            const fileName = await exportDaftarHOKToWord(expenseItems || [], activities, expenses || [], villageInfo);
            addToast(`Daftar HOK berhasil diunduh: ${fileName}`, 'success');
        } catch (err) {
            addToast('Gagal export HOK: ' + err.message, 'error');
        }
        setExporting(null);
    };

    const progressColor = (p) => {
        if (p >= 100) return 'green';
        if (p >= 50) return 'blue';
        if (p > 0) return 'amber';
        return 'red';
    };

    if (appLoading) return <PageLoadingSkeleton type="cards" />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Validation Banner */}
            {(exportValidation.hasErrors || exportValidation.hasWarnings) && (
                <motion.div
                    className={`validation-banner ${exportValidation.hasErrors ? 'error' : 'warning'}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.9rem' }}>
                                {exportValidation.hasErrors ? 'Data belum lengkap — export tidak dapat dilakukan' : 'Peringatan — beberapa data belum lengkap'}
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', lineHeight: 1.7 }}>
                                {exportValidation.errors.map((e, i) => <li key={`e-${i}`} style={{ fontWeight: 600 }}>{e}</li>)}
                                {exportValidation.warnings.map((w, i) => <li key={`w-${i}`}>{w}</li>)}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Header Card */}
            <motion.div
                className="card"
                style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: 'white', border: 'none' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
                            Generate LPJ per Kegiatan
                        </h2>
                        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            {villageInfo.nama_desa} — {villageInfo.periode} — TA {villageInfo.tahun_anggaran}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                            onClick={handleExportAllExcel}
                            disabled={!!exporting || !exportValidation.canExport}
                        >
                            {exporting === 'excel-all' ? <Loader2 size={18} className="spin" /> : <FileSpreadsheet size={18} />}
                            LPJ Lengkap (Excel)
                        </button>
                        <button
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                            onClick={handleExportAllWord}
                            disabled={!!exporting || !exportValidation.canExport}
                        >
                            {exporting === 'word-all' ? <Loader2 size={18} className="spin" /> : <FileText size={18} />}
                            LPJ Lengkap (Word)
                        </button>
                        <button
                            className="btn"
                            style={{ background: 'rgba(239,68,68,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                            onClick={handleExportAllPdf}
                            disabled={!!exporting || !exportValidation.canExport}
                        >
                            {exporting === 'pdf-all' ? <Loader2 size={18} className="spin" /> : <FileDown size={18} />}
                            LPJ Lengkap (PDF)
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ═══ Tiga Pilar Dokumen LPJ Resmi ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ marginBottom: '24px' }}
            >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                    📋 Tiga Pilar Dokumen LPJ Resmi
                </h3>
                <div className="pilar-grid">
                    {/* ── Pilar 1: Buku Utama LPJ ── */}
                    <div className="pilar-card pilar-card-1">
                        <div className="pilar-card-header">
                            <div className="pilar-card-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                                <BookOpen size={22} />
                            </div>
                            <div>
                                <div className="pilar-card-title">Buku Utama LPJ</div>
                                <div className="pilar-card-desc">Cover, Kata Pengantar, BAB I-III, TTD</div>
                            </div>
                        </div>
                        <div className="pilar-card-body">
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <span className={`pilar-badge-${narrativeFieldCount >= 6 ? 'ready' : narrativeFieldCount > 0 ? 'incomplete' : 'empty'}`}>
                                    {narrativeFieldCount}/8 naratif terisi
                                </span>
                                <span className={`pilar-badge-${activities.length > 0 ? 'ready' : 'empty'}`}>
                                    {activities.length} kegiatan
                                </span>
                            </div>
                            <NarrativeEditor disabled={!canWrite} />
                        </div>
                        <div className="pilar-card-footer">
                            <button
                                className="btn btn-primary btn-sm"
                                style={{ width: '100%' }}
                                onClick={handleExportBukuUtama}
                                disabled={!!exporting || !exportValidation.canExport}
                            >
                                {exporting === 'buku-utama' ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                                Download Buku Utama (.docx)
                            </button>
                        </div>
                    </div>

                    {/* ── Pilar 2: SPJ Keuangan ── */}
                    <div className="pilar-card pilar-card-2">
                        <div className="pilar-card-header">
                            <div className="pilar-card-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                <Receipt size={22} />
                            </div>
                            <div>
                                <div className="pilar-card-title">SPJ Keuangan</div>
                                <div className="pilar-card-desc">Kuitansi & Daftar HOK per belanja</div>
                            </div>
                        </div>
                        <div className="pilar-card-body">
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <span className={`pilar-badge-${kuitansiCount > 0 ? 'ready' : 'empty'}`}>
                                    {kuitansiCount} kuitansi
                                </span>
                                <span className={`pilar-badge-${hokCount > 0 ? 'ready' : 'empty'}`}>
                                    {hokCount} data HOK
                                </span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                                Detail kuitansi & HOK diisi melalui halaman <strong>Belanja</strong> (klik expand tiap item).
                            </p>
                        </div>
                        <div className="pilar-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                                className="btn btn-sm"
                                style={{ width: '100%', background: '#16a34a', color: 'white' }}
                                onClick={handleExportKuitansi}
                                disabled={!!exporting || kuitansiCount === 0}
                            >
                                {exporting === 'kuitansi' ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                                Download Kuitansi ({kuitansiCount})
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                style={{ width: '100%' }}
                                onClick={handleExportHOK}
                                disabled={!!exporting || hokCount === 0}
                            >
                                {exporting === 'hok' ? <Loader2 size={15} className="spin" /> : <Users size={15} />}
                                Download Daftar HOK ({hokCount})
                            </button>
                        </div>
                    </div>

                    {/* ── Pilar 3: Administrasi Pengadaan ── */}
                    <div className="pilar-card pilar-card-3">
                        <div className="pilar-card-header">
                            <div className="pilar-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <Package size={22} />
                            </div>
                            <div>
                                <div className="pilar-card-title">Administrasi Pengadaan</div>
                                <div className="pilar-card-desc">LPJ per kegiatan (fisik & non-fisik)</div>
                            </div>
                        </div>
                        <div className="pilar-card-body">
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <span className={`pilar-badge-${activities.length > 0 ? 'ready' : 'empty'}`}>
                                    {activities.length} kegiatan
                                </span>
                                <span className={`pilar-badge-${attachData.belanjaTotal > 0 ? 'ready' : 'empty'}`}>
                                    {attachData.belanjaTotal} lampiran belanja
                                </span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                Export per kegiatan tersedia di daftar di bawah. Bundel lengkap (Excel/Word/PDF) di header atas.
                            </p>
                        </div>
                        <div className="pilar-card-footer">
                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                <button
                                    className="btn btn-sm" style={{ flex: 1, background: '#d97706', color: 'white' }}
                                    onClick={handleExportAllExcel}
                                    disabled={!!exporting || !exportValidation.canExport}
                                >
                                    {exporting === 'excel-all' ? <Loader2 size={14} className="spin" /> : <FileSpreadsheet size={14} />}
                                    Excel
                                </button>
                                <button
                                    className="btn btn-sm" style={{ flex: 1, background: '#2563eb', color: 'white' }}
                                    onClick={handleExportAllWord}
                                    disabled={!!exporting || !exportValidation.canExport}
                                >
                                    {exporting === 'word-all' ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
                                    Word
                                </button>
                                <button
                                    className="btn btn-sm" style={{ flex: 1, background: '#ef4444', color: 'white' }}
                                    onClick={handleExportAllPdf}
                                    disabled={!!exporting || !exportValidation.canExport}
                                >
                                    {exporting === 'pdf-all' ? <Loader2 size={14} className="spin" /> : <FileDown size={14} />}
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Search & Filter Bar */}
            <div className="page-toolbar" style={{ marginBottom: '20px' }}>
                <div className="page-toolbar-left">
                    <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            className="form-input"
                            style={{ paddingLeft: '36px' }}
                            placeholder="Cari kegiatan..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ maxWidth: '260px' }}
                        value={filterBidang}
                        onChange={e => setFilterBidang(e.target.value)}
                    >
                        <option value="">Semua Bidang</option>
                        {budgetCategories.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
                <div className="page-toolbar-right">
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                        {filteredActivities.length} kegiatan ditemukan
                    </span>
                </div>
            </div>

            {/* Activity List Grouped by Bidang */}
            {Object.keys(groupedActivities).length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={ClipboardList}
                        title="Tidak ada kegiatan ditemukan"
                        description="Coba ubah filter pencarian atau tambahkan kegiatan baru"
                    />
                </div>
            ) : (
                Object.entries(groupedActivities).map(([bidangName, acts], bidangIdx) => {
                    const structure = bidangStructure[bidangName];
                    const Icon = structure ? iconMap[structure.icon] || ClipboardList : ClipboardList;
                    const color = structure?.color || '#6366f1';

                    return (
                        <motion.div
                            key={bidangName}
                            className="card"
                            style={{ marginBottom: '16px' }}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: bidangIdx * 0.08 }}
                        >
                            {/* Bidang Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                marginBottom: '16px', paddingBottom: '12px',
                                borderBottom: '1px solid var(--border-secondary)',
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                    background: `${color}15`, color: color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bidangName}</div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>{acts.length} kegiatan</div>
                                </div>
                            </div>

                            {/* Activity Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {acts.map((act, idx) => {
                                    const cfg = statusConfig[act.status];
                                    const pct = act.anggaran > 0 ? ((act.realisasi / act.anggaran) * 100) : 0;
                                    const isSelected = selectedActivity?.id === act.id;

                                    return (
                                        <motion.div
                                            key={act.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.05 * idx }}
                                            style={{
                                                background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                                                border: `1px solid ${isSelected ? color : 'var(--border-secondary)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                padding: '16px',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => setSelectedActivity(isSelected ? null : act)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                                {/* Left - Activity Info */}
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.nama}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span className={`badge ${cfg.badge}`} style={{ fontSize: '0.68rem' }}>
                                                            <span className="badge-dot" />{cfg.label}
                                                        </span>
                                                        <span className="badge" style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            background: (act.jenis_lpj || 'fisik') === 'fisik' ? '#dbeafe' : '#fef3c7',
                                                            color: (act.jenis_lpj || 'fisik') === 'fisik' ? '#1d4ed8' : '#92400e',
                                                            border: `1px solid ${(act.jenis_lpj || 'fisik') === 'fisik' ? '#93c5fd' : '#fcd34d'}`,
                                                        }}>
                                                            {(act.jenis_lpj || 'fisik') === 'fisik' ? '🔨 Fisik' : '📋 Non-Fisik'}
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                            <FolderOpen size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                            {act.sub_bidang}
                                                        </span>
                                                        {act.pelaksana && (
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                                • {act.pelaksana}
                                                            </span>
                                                        )}
                                                        {(attachData.kegiatan?.[act.id]?.length || 0) > 0 && (
                                                            <span className="attachment-badge" style={{ fontSize: '0.65rem' }}>
                                                                <Paperclip size={9} />
                                                                {attachData.kegiatan[act.id].length} file
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Budget row */}
                                                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem' }}>
                                                        <div>
                                                            <span style={{ color: 'var(--text-tertiary)' }}>Anggaran: </span>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRupiah(act.anggaran)}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: 'var(--text-tertiary)' }}>Realisasi: </span>
                                                            <span style={{ fontWeight: 600, color: 'var(--accent-500)' }}>{formatRupiah(act.realisasi)}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: 'var(--text-tertiary)' }}>Progres: </span>
                                                            <span style={{ fontWeight: 600 }}>{act.progres}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right - Export Buttons */}
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleExportActivityExcel(act); }}
                                                        disabled={!!exporting}
                                                        title="Export LPJ Excel"
                                                    >
                                                        {exporting === `excel-${act.id}` ? <Loader2 size={15} className="spin" /> : <FileSpreadsheet size={15} />}
                                                        Excel
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#2563eb', color: 'white' }}
                                                        onClick={(e) => { e.stopPropagation(); handleExportActivityWord(act); }}
                                                        disabled={!!exporting}
                                                        title={`Export LPJ Word (${(act.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik — 15 Dokumen' : 'Non-Fisik — 7 Dokumen'})`}
                                                    >
                                                        {exporting === `word-${act.id}` ? <Loader2 size={15} className="spin" /> : <FileText size={15} />}
                                                        Word
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#ef4444', color: 'white' }}
                                                        onClick={(e) => { e.stopPropagation(); handleExportActivityPdf(act); }}
                                                        disabled={!!exporting}
                                                        title="Export LPJ PDF"
                                                    >
                                                        {exporting === `pdf-${act.id}` ? <Loader2 size={15} className="spin" /> : <FileDown size={15} />}
                                                        PDF
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div style={{ marginTop: '10px' }}>
                                                <div className="progress-bar" style={{ height: '5px' }}>
                                                    <motion.div
                                                        className={`progress-fill ${progressColor(pct)}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(pct, 100)}%` }}
                                                        transition={{ duration: 0.8 }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Expanded Preview */}
                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{
                                                            marginTop: '16px', paddingTop: '16px',
                                                            borderTop: '1px solid var(--border-secondary)',
                                                        }}>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                                                                Preview LPJ Kegiatan
                                                            </div>
                                                            <div className="lpj-preview" style={{ padding: '24px', fontSize: '0.78rem', lineHeight: 1.6 }}>
                                                                <h1 style={{ fontSize: '1rem', marginBottom: '2px' }}>LAPORAN PERTANGGUNGJAWABAN KEGIATAN</h1>
                                                                <h2 style={{ fontSize: '0.88rem', marginBottom: '16px' }}>{villageInfo.nama_desa} — TA {villageInfo.tahun_anggaran}</h2>

                                                                <h3 style={{ fontSize: '0.85rem', margin: '16px 0 8px' }}>I. Informasi Kegiatan</h3>
                                                                <table>
                                                                    <tbody>
                                                                        {[
                                                                            ['Nama Kegiatan', act.nama],
                                                                            ['Bidang', act.bidang],
                                                                            ['Sub Bidang', act.sub_bidang],
                                                                            ['Status', cfg.label],
                                                                            ['Progres', `${act.progres}%`],
                                                                            ['Pelaksana', act.pelaksana || '-'],
                                                                            ['Periode', `${formatShortDate(act.mulai)} — ${formatShortDate(act.selesai)}`],
                                                                        ].map(([label, value], i) => (
                                                                            <tr key={i}>
                                                                                <td style={{ fontWeight: 600, width: '160px' }}>{label}</td>
                                                                                <td>{value}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>

                                                                <h3 style={{ fontSize: '0.85rem', margin: '16px 0 8px' }}>II. Realisasi Anggaran</h3>
                                                                <table>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Uraian</th>
                                                                            <th className="text-right">Jumlah (Rp)</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>Anggaran</td>
                                                                            <td className="text-right">{formatRupiah(act.anggaran)}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>Realisasi</td>
                                                                            <td className="text-right">{formatRupiah(act.realisasi)}</td>
                                                                        </tr>
                                                                        <tr className="total-row">
                                                                            <td>Sisa Anggaran</td>
                                                                            <td className="text-right">{formatRupiah(act.anggaran - act.realisasi)}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style={{ fontWeight: 600 }}>Persentase Realisasi</td>
                                                                            <td className="text-right" style={{ fontWeight: 600 }}>{pct.toFixed(1)}%</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>

                                                                <div className="signature-section" style={{ marginTop: '30px', padding: '0 20px' }}>
                                                                    <div className="signature-block">
                                                                        <p>Mengetahui,</p>
                                                                        <p className="name" style={{ marginTop: '40px' }}>{villageInfo.sekretaris_desa}</p>
                                                                        <p style={{ fontSize: '0.76rem' }}>Sekretaris Desa</p>
                                                                    </div>
                                                                    <div className="signature-block">
                                                                        <p>Kepala Desa,</p>
                                                                        <p className="name" style={{ marginTop: '40px' }}>{villageInfo.kepala_desa}</p>
                                                                        <p style={{ fontSize: '0.76rem' }}>Kepala Desa</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })
            )}

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media print {
                    .sidebar, .header, .page-toolbar, .stats-grid, .card:first-child {
                        display: none !important;
                    }
                    .main-wrapper {
                        margin-left: 0 !important;
                    }
                    .main-content {
                        padding: 0 !important;
                    }
                    .lpj-preview {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </motion.div>
    );
}
