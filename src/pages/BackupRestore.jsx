import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Download, Upload, AlertTriangle, CheckCircle2, Loader2,
    Database, Calendar, Shield, RefreshCw, FileJson, HardDrive,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useRole } from '../hooks/useRole';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';

const BACKUP_KEY = 'lpj-desa-last-backup';
const BACKUP_VERSION = '6.0';

export default function BackupRestore() {
    const { state, loading: appLoading, activeTahun, setActiveTahun, fetchAvailableYears } = useApp();
    const { isAdmin } = useRole();
    const { addToast } = useToast();
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    const lastBackup = useMemo(() => {
        try {
            const raw = localStorage.getItem(BACKUP_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }, [exporting]);

    // Stats for current year
    const stats = useMemo(() => [
        { label: 'Pendapatan', count: state.incomes?.length || 0, icon: Database, color: '#22c55e' },
        { label: 'Belanja', count: state.expenses?.length || 0, icon: Database, color: '#3b82f6' },
        { label: 'Kegiatan', count: state.activities?.length || 0, icon: Database, color: '#8b5cf6' },
        { label: 'Pembiayaan', count: state.pembiayaan?.length || 0, icon: Database, color: '#f59e0b' },
    ], [state]);

    // ── EXPORT ──
    const handleExport = async () => {
        setExporting(true);
        try {
            // Fetch all data for active year
            const [incomes, expenses, activities, pembiayaan, subBidang, villageInfo, pejabat, attachments, expenseItems, lpjNarratives] = await Promise.all([
                supabase.from('incomes').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('expenses').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('activities').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('pembiayaan').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('sub_bidang').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('village_info').select('*').eq('id', 1).single(),
                supabase.from('pejabat_desa').select('*').order('id'),
                supabase.from('attachments').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('expense_items').select('*').eq('tahun_anggaran', activeTahun).order('id'),
                supabase.from('lpj_narratives').select('*').eq('tahun_anggaran', activeTahun).order('id'),
            ]);

            const backup = {
                _meta: {
                    version: BACKUP_VERSION,
                    app: 'LPJ Desa',
                    tahun_anggaran: activeTahun,
                    nama_desa: state.villageInfo?.nama_desa || '',
                    exported_at: new Date().toISOString(),
                    total_records: (incomes.data?.length || 0) + (expenses.data?.length || 0)
                        + (activities.data?.length || 0) + (pembiayaan.data?.length || 0)
                        + (subBidang.data?.length || 0) + (attachments.data?.length || 0)
                        + (expenseItems.data?.length || 0) + (lpjNarratives.data?.length || 0),
                },
                village_info: villageInfo.data || {},
                pejabat_desa: pejabat.data || [],
                incomes: incomes.data || [],
                expenses: expenses.data || [],
                activities: activities.data || [],
                pembiayaan: pembiayaan.data || [],
                sub_bidang: subBidang.data || [],
                attachments: attachments.data || [],
                expense_items: expenseItems.data || [],
                lpj_narratives: lpjNarratives.data || [],
            };

            // Download
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const desa = (state.villageInfo?.nama_desa || 'Desa').replace(/\s+/g, '_');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `backup_lpj_${desa}_TA${activeTahun}_${date}.json`;
            a.click();
            URL.revokeObjectURL(url);

            // Save last backup info
            localStorage.setItem(BACKUP_KEY, JSON.stringify({
                date: new Date().toISOString(),
                tahun: activeTahun,
                records: backup._meta.total_records,
            }));

            addToast(`Backup berhasil! ${backup._meta.total_records} record dieksport`, 'success');
        } catch (err) {
            console.error('Export error:', err);
            addToast('Gagal membuat backup: ' + err.message, 'error');
        } finally {
            setExporting(false);
        }
    };

    // ── IMPORT ──
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);

                // Validate structure
                if (!data._meta || !data._meta.version) {
                    addToast('File tidak valid: bukan file backup LPJ Desa', 'error');
                    return;
                }

                if (!data.incomes && !data.expenses && !data.activities) {
                    addToast('File backup kosong atau tidak valid', 'error');
                    return;
                }

                setPendingFile(data);
                setPreviewData({
                    tahun: data._meta.tahun_anggaran,
                    desa: data._meta.nama_desa,
                    date: data._meta.exported_at,
                    incomes: data.incomes?.length || 0,
                    expenses: data.expenses?.length || 0,
                    activities: data.activities?.length || 0,
                    pembiayaan: data.pembiayaan?.length || 0,
                    sub_bidang: data.sub_bidang?.length || 0,
                    attachments: data.attachments?.length || 0,
                    expense_items: data.expense_items?.length || 0,
                    lpj_narratives: data.lpj_narratives?.length || 0,
                });
                setShowConfirm(true);
            } catch (err) {
                addToast('File JSON tidak valid: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };

    const handleRestore = async () => {
        if (!pendingFile) return;
        setShowConfirm(false);
        setImporting(true);
        setImportProgress(0);

        const tahun = pendingFile._meta.tahun_anggaran;
        const steps = 8;
        let currentStep = 0;

        try {
            // Helper to clean IDs for upsert
            const cleanRows = (rows, tahun) => rows.map(({ id, created_at, ...rest }) => ({
                ...rest,
                tahun_anggaran: tahun,
            }));

            // 1. Delete existing data for this year
            await supabase.from('expense_items').delete().eq('tahun_anggaran', tahun);
            await supabase.from('lpj_narratives').delete().eq('tahun_anggaran', tahun);
            await supabase.from('incomes').delete().eq('tahun_anggaran', tahun);
            await supabase.from('expenses').delete().eq('tahun_anggaran', tahun);
            await supabase.from('activities').delete().eq('tahun_anggaran', tahun);
            await supabase.from('pembiayaan').delete().eq('tahun_anggaran', tahun);
            await supabase.from('sub_bidang').delete().eq('tahun_anggaran', tahun);
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 2. Insert incomes
            if (pendingFile.incomes?.length) {
                const { error } = await supabase.from('incomes').insert(cleanRows(pendingFile.incomes, tahun));
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 3. Insert expenses
            if (pendingFile.expenses?.length) {
                const { error } = await supabase.from('expenses').insert(cleanRows(pendingFile.expenses, tahun));
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 4. Insert activities + pembiayaan
            if (pendingFile.activities?.length) {
                const { error } = await supabase.from('activities').insert(cleanRows(pendingFile.activities, tahun));
                if (error) throw error;
            }
            if (pendingFile.pembiayaan?.length) {
                const { error } = await supabase.from('pembiayaan').insert(cleanRows(pendingFile.pembiayaan, tahun));
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 5. Insert sub_bidang
            if (pendingFile.sub_bidang?.length) {
                const { error } = await supabase.from('sub_bidang').insert(cleanRows(pendingFile.sub_bidang, tahun));
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 6. Insert attachments (metadata only — file storage unchanged)
            await supabase.from('attachments').delete().eq('tahun_anggaran', tahun);
            if (pendingFile.attachments?.length) {
                const { error } = await supabase.from('attachments').insert(
                    pendingFile.attachments.map(({ id, ...rest }) => ({ ...rest, tahun_anggaran: tahun }))
                );
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 7. Insert expense_items
            if (pendingFile.expense_items?.length) {
                const { error } = await supabase.from('expense_items').insert(cleanRows(pendingFile.expense_items, tahun));
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(Math.round((currentStep / steps) * 100));

            // 8. Insert lpj_narratives
            if (pendingFile.lpj_narratives?.length) {
                const { error } = await supabase.from('lpj_narratives').insert(cleanRows(pendingFile.lpj_narratives, tahun));
                if (error) throw error;
            }
            currentStep++;
            setImportProgress(100);

            // Refresh available years and reload
            await fetchAvailableYears();
            await setActiveTahun(tahun);

            addToast(`Restore berhasil! Data tahun ${tahun} telah dipulihkan`, 'success');
        } catch (err) {
            console.error('Restore error:', err);
            addToast('Gagal restore: ' + err.message, 'error');
        } finally {
            setImporting(false);
            setImportProgress(0);
            setPendingFile(null);
            setPreviewData(null);
        }
    };

    if (appLoading) return <PageLoadingSkeleton type="cards" />;

    if (!isAdmin) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Shield size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Akses Ditolak</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    Hanya Administrator yang dapat mengakses fitur Backup & Restore.
                </p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Header Card */}
            <motion.div
                className="card"
                style={{
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                    color: 'white', border: 'none',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
                            Backup & Restore Data
                        </h2>
                        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            {state.villageInfo?.nama_desa || 'Desa'} — Tahun Anggaran {activeTahun}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                            onClick={handleExport}
                            disabled={exporting || importing}
                        >
                            {exporting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                            {exporting ? 'Mengeksport...' : 'Backup Data'}
                        </button>
                        <label
                            className="btn"
                            style={{
                                background: 'rgba(34,197,94,0.25)', color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)', cursor: importing ? 'wait' : 'pointer',
                                opacity: importing ? 0.6 : 1,
                            }}
                        >
                            {importing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} />}
                            {importing ? 'Mengimport...' : 'Restore Data'}
                            <input type="file" accept=".json" onChange={handleFileSelect} hidden disabled={importing || exporting} />
                        </label>
                    </div>
                </div>
            </motion.div>

            {/* Import Progress */}
            {importing && (
                <motion.div className="card" style={{ marginBottom: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-500)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Restoring data... {importProgress}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                        <motion.div
                            className="progress-fill green"
                            animate={{ width: `${importProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                    >
                        <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                            <s.icon size={20} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{s.count}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

                {/* Last Backup */}
                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-500)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <HardDrive size={18} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Informasi Backup</div>
                    </div>
                    {lastBackup ? (
                        <div style={{ fontSize: '0.82rem', lineHeight: 1.8 }}>
                            <div>
                                <span style={{ color: 'var(--text-tertiary)' }}>Terakhir backup: </span>
                                <span style={{ fontWeight: 600 }}>
                                    {new Date(lastBackup.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-tertiary)' }}>Tahun Anggaran: </span>
                                <span style={{ fontWeight: 600 }}>{lastBackup.tahun}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-tertiary)' }}>Total record: </span>
                                <span style={{ fontWeight: 600 }}>{lastBackup.records}</span>
                            </div>
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Belum pernah melakukan backup.</p>
                    )}
                </motion.div>

                {/* How it works */}
                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <FileJson size={18} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cara Kerja</div>
                    </div>
                    <ul style={{ fontSize: '0.82rem', lineHeight: 1.8, paddingLeft: '18px', color: 'var(--text-secondary)', margin: 0 }}>
                        <li><strong>Backup</strong> mengunduh semua data tahun aktif sebagai file JSON</li>
                        <li><strong>Restore</strong> mengganti data tahun tertentu dari file backup</li>
                        <li>Data <strong>Informasi Desa</strong> dan <strong>Pejabat</strong> tidak terpengaruh restore</li>
                        <li>Backup disarankan dilakukan <strong>secara berkala</strong></li>
                    </ul>
                </motion.div>
            </div>

            {/* Confirm Import Dialog */}
            {showConfirm && previewData && (
                <div className="confirm-overlay" onClick={() => { setShowConfirm(false); setPendingFile(null); }}>
                    <motion.div
                        className="confirm-dialog"
                        onClick={e => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Konfirmasi Restore</h3>
                        </div>

                        <div style={{ fontSize: '0.84rem', lineHeight: 1.8, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                            <p style={{ marginBottom: '12px' }}>
                                Data berikut akan <strong>menggantikan</strong> semua data tahun <strong>{previewData.tahun}</strong>:
                            </p>
                            <div style={{
                                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                                padding: '12px 16px', lineHeight: 2,
                            }}>
                                <div>• Pendapatan: <strong>{previewData.incomes}</strong> record</div>
                                <div>• Belanja: <strong>{previewData.expenses}</strong> record</div>
                                <div>• Kegiatan: <strong>{previewData.activities}</strong> record</div>
                                <div>• Pembiayaan: <strong>{previewData.pembiayaan}</strong> record</div>
                                <div>• Sub Bidang: <strong>{previewData.sub_bidang}</strong> record</div>
                                <div>• Lampiran: <strong>{previewData.attachments || 0}</strong> record</div>
                                <div>• Detail Kuitansi: <strong>{previewData.expense_items || 0}</strong> record</div>
                                <div>• Naratif LPJ: <strong>{previewData.lpj_narratives || 0}</strong> record</div>
                            </div>
                            <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                Sumber: {previewData.desa} — {new Date(previewData.date).toLocaleString('id-ID')}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => { setShowConfirm(false); setPendingFile(null); }}>Batal</button>
                            <button className="btn btn-primary" onClick={handleRestore}>
                                <RefreshCw size={16} /> Ya, Restore Sekarang
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
