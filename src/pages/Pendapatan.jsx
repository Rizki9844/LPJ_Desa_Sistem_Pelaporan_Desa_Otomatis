import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, TrendingUp, Hash, Loader2, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportDropdown from '../components/ui/ExportDropdown';
import { formatRupiah, formatShortDate, incomeCategories, pendapatanStructure } from '../data/sampleData';
import { supabase } from '../lib/supabase';
import { exportFinancialToExcel } from '../utils/exportExcel';
import { exportFinancialToWord } from '../utils/exportWord';
import { exportFinancialToPdf } from '../utils/exportPdf';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useRole } from '../hooks/useRole';
import { Eye } from 'lucide-react';

const emptyForm = {
    sumber: '',
    kategori: 'Pendapatan Asli Desa',
    sub_kategori: 'Hasil Usaha Desa',
    norek: '1.1',
    jumlah: '',
    tanggal: '',
    keterangan: '',
};

export default function Pendapatan() {
    const { state, dispatch, loading, activeTahun } = useApp();
    const { addToast } = useToast();
    const { canWrite } = useRole();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const totalIncome = state.incomes.reduce((s, i) => s + Number(i.jumlah || 0), 0);

    const kategoriTotals = useMemo(() => {
        const totals = {};
        incomeCategories.forEach(k => { totals[k] = 0; });
        state.incomes.forEach(i => {
            if (totals[i.kategori] !== undefined) totals[i.kategori] += Number(i.jumlah || 0);
        });
        return totals;
    }, [state.incomes]);

    const filtered = state.incomes
        .filter(i => {
            const matchSearch = !search || i.sumber.toLowerCase().includes(search.toLowerCase()) || (i.keterangan || '').toLowerCase().includes(search.toLowerCase());
            const matchCat = !filterCat || i.kategori === filterCat;
            return matchSearch && matchCat;
        })
        .sort((a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true }));

    const handleKategoriChange = (newKategori) => {
        const struct = pendapatanStructure[newKategori];
        const firstSub = struct?.subKategori?.[0];
        setForm(p => ({
            ...p,
            kategori: newKategori,
            sub_kategori: firstSub?.nama || '',
            norek: firstSub?.norek || '',
        }));
    };

    const handleSubKategoriChange = (subNama) => {
        const struct = pendapatanStructure[form.kategori];
        const found = struct?.subKategori?.find(s => s.nama === subNama);
        setForm(p => ({
            ...p,
            sub_kategori: subNama,
            norek: found?.norek || '',
        }));
    };

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ ...item, jumlah: String(item.jumlah) });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.sumber || !form.jumlah) {
            addToast('Sumber dan jumlah harus diisi!', 'error');
            return;
        }
        if (Number(form.jumlah) <= 0) {
            addToast('Jumlah harus lebih dari 0!', 'error');
            return;
        }
        if (!form.tanggal) {
            addToast('Tanggal harus diisi!', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                sumber: form.sumber,
                kategori: form.kategori,
                sub_kategori: form.sub_kategori,
                norek: form.norek,
                jumlah: Number(form.jumlah),
                tanggal: form.tanggal,
                keterangan: form.keterangan,
            };

            if (editing) {
                const { error } = await supabase
                    .from('incomes')
                    .update(payload)
                    .eq('id', editing.id);
                if (error) throw error;

                dispatch({ type: 'UPDATE_INCOME', payload: { ...payload, id: editing.id } });
                addToast('Pendapatan berhasil diperbarui!', 'success');
            } else {
                const { data, error } = await supabase
                    .from('incomes')
                    .insert({ ...payload, tahun_anggaran: activeTahun })
                    .select()
                    .single();
                if (error) throw error;

                dispatch({ type: 'ADD_INCOME', payload: data });
                addToast('Pendapatan baru berhasil ditambahkan!', 'success');
            }
            setShowModal(false);
        } catch (err) {
            console.error('Save income error:', err);
            addToast(`Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('incomes')
                .delete()
                .eq('id', confirmDelete);
            if (error) throw error;

            dispatch({ type: 'DELETE_INCOME', payload: confirmDelete });
            addToast('Pendapatan berhasil dihapus', 'warning');
        } catch (err) {
            console.error('Delete income error:', err);
            addToast(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setSaving(false);
            setConfirmDelete(null);
        }
    };

    const availableSubKategori = pendapatanStructure[form.kategori]?.subKategori || [];

    const kategoriColor = (k) => {
        if (k === 'Pendapatan Asli Desa') return 'badge-success';
        if (k === 'Transfer') return 'badge-info';
        return 'badge-warning';
    };

    if (loading) return <PageLoadingSkeleton type="table" />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Read-only banner for kepala_desa */}
            {!canWrite && (
                <div className="readonly-banner">
                    <Eye size={18} />
                    <span>Mode Lihat Saja — Anda hanya memiliki akses untuk melihat data ini.</span>
                </div>
            )}
            {/* Summary Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                <motion.div className="stat-card income" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-icon income"><TrendingUp /></div>
                    <div className="stat-label">Total Pendapatan</div>
                    <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatRupiah(totalIncome)}</div>
                </motion.div>
                {incomeCategories.map((k, idx) => (
                    <motion.div
                        key={k}
                        className="stat-card balance"
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (idx + 1) * 0.05 }}
                        style={{ cursor: 'pointer', border: filterCat === k ? '2px solid var(--primary-400)' : undefined }}
                        onClick={() => setFilterCat(filterCat === k ? '' : k)}
                    >
                        <div className="stat-icon balance" style={{ fontSize: '0.75rem', width: '28px', height: '28px' }}>
                            <Hash size={16} />
                        </div>
                        <div className="stat-label" style={{ fontSize: '0.7rem' }}>{k}</div>
                        <div className="stat-value" style={{ fontSize: '1rem' }}>{formatRupiah(kategoriTotals[k])}</div>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-input-wrapper">
                        <Search />
                        <input className="form-input search-input" placeholder="Cari pendapatan..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ minWidth: '200px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                        <option value="">Semua Kategori</option>
                        {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="page-toolbar-right" style={{ display: 'flex', gap: '8px' }}>
                    <ExportDropdown
                        label="Export Pendapatan"
                        onExportExcel={() => exportFinancialToExcel('pendapatan', state.incomes, state.villageInfo)}
                        onExportWord={() => exportFinancialToWord('pendapatan', state.incomes, state.villageInfo)}
                        onExportPdf={() => exportFinancialToPdf('pendapatan', state.incomes, state.villageInfo)}
                        disabled={state.incomes.length === 0}
                    />
                    {canWrite && (
                        <button className="btn btn-primary" onClick={openNew} disabled={saving}>
                            <Plus size={18} /> Tambah Pendapatan
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="table-container" style={{ background: 'var(--bg-card)' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>KOREK</th>
                                <th>Sumber Pendapatan</th>
                                <th>Kategori</th>
                                <th>Jumlah</th>
                                <th>Tanggal</th>
                                <th>Keterangan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState
                                            icon={Wallet}
                                            title="Belum ada data pendapatan"
                                            description="Klik tombol 'Tambah Pendapatan' untuk mulai mencatat pemasukan desa"
                                            actionLabel={canWrite ? "Tambah Pendapatan" : undefined}
                                            onAction={canWrite ? openNew : undefined}
                                            compact
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, idx) => (
                                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                                        <td>
                                            <span style={{
                                                background: 'var(--bg-tertiary)',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                fontFamily: 'monospace',
                                                color: 'var(--primary-500)',
                                            }}>
                                                {item.norek || '-'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{item.sumber}</td>
                                        <td><span className={`badge ${kategoriColor(item.kategori)}`}>{item.kategori}</span></td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-500)' }}>{formatRupiah(item.jumlah)}</td>
                                        <td>{formatShortDate(item.tanggal)}</td>
                                        <td className="truncate" style={{ maxWidth: '180px' }}>{item.keterangan}</td>
                                        <td>
                                            {canWrite && (
                                                <div className="table-actions">
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(item)} title="Edit" disabled={saving}>
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(item.id)} title="Hapus" style={{ color: 'var(--danger-500)' }} disabled={saving}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.97 }}
                            transition={{ duration: 0.25 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '560px' }}
                        >
                            <div className="modal-header">
                                <div className="modal-title">{editing ? 'Edit Pendapatan' : 'Tambah Pendapatan Baru'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                            </div>
                            <div className="modal-body">
                                {/* Kategori & KOREK */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Kategori Bidang *</label>
                                        <select
                                            className="form-input form-select"
                                            value={form.kategori}
                                            onChange={e => handleKategoriChange(e.target.value)}
                                        >
                                            {incomeCategories.map(c => (
                                                <option key={c} value={c}>
                                                    {pendapatanStructure[c]?.norek}. {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">KOREK *</label>
                                        <select
                                            className="form-input form-select"
                                            value={form.norek}
                                            onChange={e => {
                                                const sub = availableSubKategori.find(s => s.norek === e.target.value);
                                                setForm(p => ({ ...p, norek: e.target.value, sub_kategori: sub?.nama || '' }));
                                            }}
                                        >
                                            {availableSubKategori.map(s => (
                                                <option key={s.norek} value={s.norek}>
                                                    {s.norek} — {s.nama}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Sumber Pendapatan */}
                                <div className="form-group">
                                    <label className="form-label">Sumber Pendapatan *</label>
                                    <input className="form-input" value={form.sumber} onChange={e => setForm(p => ({ ...p, sumber: e.target.value }))} placeholder="Contoh: Dana Desa (DD)" />
                                </div>

                                {/* Jumlah & Tanggal */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Jumlah (Rp) *</label>
                                        <input className="form-input" type="number" value={form.jumlah} onChange={e => setForm(p => ({ ...p, jumlah: e.target.value }))} placeholder="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tanggal</label>
                                        <input className="form-input" type="date" value={form.tanggal} onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} />
                                    </div>
                                </div>

                                {/* Keterangan */}
                                <div className="form-group">
                                    <label className="form-label">Keterangan</label>
                                    <textarea className="form-input form-textarea" value={form.keterangan} onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))} placeholder="Keterangan tambahan..." rows={3} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {editing ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title="Hapus Pendapatan?"
                message="Data pendapatan ini akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan."
                loading={saving}
            />
        </motion.div>
    );
}
