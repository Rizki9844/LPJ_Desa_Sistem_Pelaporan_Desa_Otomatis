import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, TrendingDown, Filter, Loader2, Receipt, Paperclip, Eye, ChevronDown, ChevronUp, FileText, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportDropdown from '../components/ui/ExportDropdown';
import FileUpload from '../components/ui/FileUpload';
import { formatRupiah, formatShortDate, budgetCategories, bidangStructure } from '../data/sampleData';
import { supabase } from '../lib/supabase';
import { exportFinancialToExcel } from '../utils/exportExcel';
import { exportFinancialToWord } from '../utils/exportWord';
import { exportFinancialToPdf } from '../utils/exportPdf';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useRole } from '../hooks/useRole';

const emptyForm = { uraian: '', kategori: 'Penyelenggaraan Pemerintahan', sub_bidang: '', norek: '', jumlah: '', tanggal: '', penerima: '' };
const emptyItemForm = { tipe: 'kuitansi', tanggal: '', uraian: '', dibayar_kepada: '', nik: '', volume: '1', satuan: '', harga_satuan: '', jumlah: '', keterangan: '', activity_id: '' };

export default function Belanja() {
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

    // ── Expense Items state ──
    const [expandedExpenseId, setExpandedExpenseId] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemForm, setItemForm] = useState(emptyItemForm);
    const [savingItem, setSavingItem] = useState(false);
    const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);

    const totalExpense = state.expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0);

    const getSubBidangObjects = (bidang) => state.subBidang?.[bidang] || [];
    const availableSubBidang = useMemo(() => getSubBidangObjects(form.kategori), [form.kategori, state.subBidang]);

    const filtered = state.expenses
        .filter(e => {
            const matchSearch = !search || e.uraian.toLowerCase().includes(search.toLowerCase()) || (e.penerima || '').toLowerCase().includes(search.toLowerCase());
            const matchCat = !filterCat || e.kategori === filterCat;
            return matchSearch && matchCat;
        })
        .sort((a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true }));

    const handleKategoriChange = (newKategori) => {
        const sbObjs = getSubBidangObjects(newKategori);
        const firstSb = sbObjs[0];
        setForm(p => ({
            ...p,
            kategori: newKategori,
            sub_bidang: firstSb?.nama || '',
            norek: '',
        }));
    };

    const openNew = () => {
        const defaultForm = { ...emptyForm };
        const sbObjs = getSubBidangObjects(defaultForm.kategori);
        if (sbObjs.length) defaultForm.sub_bidang = sbObjs[0].nama;
        setEditing(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ ...item, jumlah: String(item.jumlah) });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.uraian || !form.jumlah) {
            addToast('Uraian dan jumlah harus diisi!', 'error');
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
        if (!form.penerima) {
            addToast('Penerima harus diisi!', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                uraian: form.uraian,
                kategori: form.kategori,
                sub_bidang: form.sub_bidang,
                norek: form.norek,
                jumlah: Number(form.jumlah),
                tanggal: form.tanggal,
                penerima: form.penerima,
            };

            if (editing) {
                const { error } = await supabase
                    .from('expenses')
                    .update(payload)
                    .eq('id', editing.id);
                if (error) throw error;

                dispatch({ type: 'UPDATE_EXPENSE', payload: { ...payload, id: editing.id } });
                addToast('Belanja berhasil diperbarui!', 'success');
            } else {
                const { data, error } = await supabase
                    .from('expenses')
                    .insert({ ...payload, tahun_anggaran: activeTahun })
                    .select()
                    .single();
                if (error) throw error;

                dispatch({ type: 'ADD_EXPENSE', payload: data });
                addToast('Belanja baru berhasil ditambahkan!', 'success');
            }

            // Warning if total expense > total income
            const totalIncome = state.incomes.reduce((s, i) => s + Number(i.jumlah || 0), 0);
            const newTotalExpense = state.expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0) + (editing ? 0 : Number(form.jumlah));
            if (newTotalExpense > totalIncome && totalIncome > 0) {
                addToast('⚠️ Total belanja melebihi total pendapatan!', 'warning');
            }

            setShowModal(false);
        } catch (err) {
            console.error('Save expense error:', err);
            addToast(`Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setSaving(true);
        try {
            // ── Cleanup attachments (cascade) ──
            const { data: attachments } = await supabase
                .from('attachments')
                .select('id, file_url')
                .eq('entity_type', 'belanja')
                .eq('entity_id', confirmDelete);

            if (attachments?.length) {
                const storagePaths = attachments
                    .map(a => {
                        const parts = a.file_url.split('/storage/v1/object/public/lampiran/');
                        return parts[1] ? decodeURIComponent(parts[1]) : null;
                    })
                    .filter(Boolean);
                if (storagePaths.length) {
                    await supabase.storage.from('lampiran').remove(storagePaths);
                }
                await supabase.from('attachments').delete()
                    .eq('entity_type', 'belanja').eq('entity_id', confirmDelete);
            }

            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', confirmDelete);
            if (error) throw error;

            dispatch({ type: 'DELETE_EXPENSE', payload: confirmDelete });
            addToast('Belanja berhasil dihapus', 'warning');
        } catch (err) {
            console.error('Delete expense error:', err);
            addToast(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setSaving(false);
            setConfirmDelete(null);
        }
    };

    // ══════════════════════════════════════
    // EXPENSE ITEMS CRUD
    // ══════════════════════════════════════

    const getItemsForExpense = (expenseId) =>
        (state.expenseItems || []).filter(ei => ei.expense_id === expenseId);

    const getItemCountForExpense = (expenseId) =>
        (state.expenseItems || []).filter(ei => ei.expense_id === expenseId).length;

    const openNewItem = (expenseId, tipe = 'kuitansi') => {
        setEditingItem(null);
        setItemForm({ ...emptyItemForm, tipe, expense_id: expenseId });
        setShowItemModal(true);
    };

    const openEditItem = (item) => {
        setEditingItem(item);
        setItemForm({
            ...item,
            volume: String(item.volume || 1),
            harga_satuan: String(item.harga_satuan || 0),
            jumlah: String(item.jumlah || 0),
            activity_id: item.activity_id ? String(item.activity_id) : '',
        });
        setShowItemModal(true);
    };

    const handleItemAutoCalc = (field, value, prev) => {
        const updated = { ...prev, [field]: value };
        if (field === 'volume' || field === 'harga_satuan') {
            const vol = Number(updated.volume) || 0;
            const harga = Number(updated.harga_satuan) || 0;
            updated.jumlah = String(vol * harga);
        }
        return updated;
    };

    const handleItemSubmit = async () => {
        if (!itemForm.uraian && !itemForm.dibayar_kepada) {
            addToast('Uraian atau nama penerima harus diisi!', 'error');
            return;
        }
        setSavingItem(true);
        try {
            const payload = {
                expense_id: itemForm.expense_id || editingItem?.expense_id,
                activity_id: itemForm.activity_id ? Number(itemForm.activity_id) : null,
                tipe: itemForm.tipe,
                tanggal: itemForm.tanggal,
                uraian: itemForm.uraian,
                dibayar_kepada: itemForm.dibayar_kepada,
                nik: itemForm.nik,
                volume: Number(itemForm.volume) || 1,
                satuan: itemForm.satuan,
                harga_satuan: Number(itemForm.harga_satuan) || 0,
                jumlah: Number(itemForm.jumlah) || 0,
                keterangan: itemForm.keterangan,
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('expense_items')
                    .update(payload)
                    .eq('id', editingItem.id);
                if (error) throw error;
                dispatch({ type: 'UPDATE_EXPENSE_ITEM', payload: { ...payload, id: editingItem.id, tahun_anggaran: activeTahun } });
                addToast('Detail berhasil diperbarui!', 'success');
            } else {
                const { data, error } = await supabase
                    .from('expense_items')
                    .insert({ ...payload, tahun_anggaran: activeTahun })
                    .select()
                    .single();
                if (error) throw error;
                dispatch({ type: 'ADD_EXPENSE_ITEM', payload: data });
                addToast(`${payload.tipe === 'hok' ? 'Data HOK' : 'Detail kuitansi'} berhasil ditambahkan!`, 'success');
            }

            setShowItemModal(false);
        } catch (err) {
            console.error('Save expense item error:', err);
            addToast(`Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            setSavingItem(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!confirmDeleteItem) return;
        setSavingItem(true);
        try {
            const { error } = await supabase
                .from('expense_items')
                .delete()
                .eq('id', confirmDeleteItem);
            if (error) throw error;
            dispatch({ type: 'DELETE_EXPENSE_ITEM', payload: confirmDeleteItem });
            addToast('Detail item berhasil dihapus', 'warning');
        } catch (err) {
            console.error('Delete item error:', err);
            addToast(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setSavingItem(false);
            setConfirmDeleteItem(null);
        }
    };

    if (loading) return <PageLoadingSkeleton type="table" />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {!canWrite && (
                <div className="readonly-banner">
                    <Eye size={18} />
                    <span>Mode Lihat Saja — Anda hanya memiliki akses untuk melihat data ini.</span>
                </div>
            )}
            {/* Summary */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                <motion.div className="stat-card expense" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-icon expense"><TrendingDown /></div>
                    <div className="stat-label">Total Belanja</div>
                    <div className="stat-value" style={{ fontSize: '1.4rem' }}>{formatRupiah(totalExpense)}</div>
                </motion.div>
                <motion.div className="stat-card balance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="stat-icon balance"><Filter /></div>
                    <div className="stat-label">Jumlah Item</div>
                    <div className="stat-value" style={{ fontSize: '1.4rem' }}>{state.expenses.length}</div>
                </motion.div>
                <motion.div className="stat-card activities" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="stat-icon activities"><TrendingDown /></div>
                    <div className="stat-label">Kategori</div>
                    <div className="stat-value" style={{ fontSize: '1.4rem' }}>{new Set(state.expenses.map(e => e.kategori)).size}</div>
                </motion.div>
            </div>

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-input-wrapper">
                        <Search />
                        <input className="form-input search-input" placeholder="Cari belanja..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ minWidth: '200px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                        <option value="">Semua Kategori</option>
                        {budgetCategories.map(c => <option key={c} value={c}>{bidangStructure[c]?.norek}. {c}</option>)}
                    </select>
                </div>
                <div className="page-toolbar-right" style={{ display: 'flex', gap: '8px' }}>
                    <ExportDropdown
                        label="Export Belanja"
                        onExportExcel={() => exportFinancialToExcel('belanja', state.expenses, state.villageInfo)}
                        onExportWord={() => exportFinancialToWord('belanja', state.expenses, state.villageInfo)}
                        onExportPdf={() => exportFinancialToPdf('belanja', state.expenses, state.villageInfo)}
                        disabled={state.expenses.length === 0}
                    />
                    {canWrite && (
                        <button className="btn btn-primary" onClick={openNew} disabled={saving}>
                            <Plus size={18} /> Tambah Belanja
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
                                <th>Uraian Belanja</th>
                                <th>Kategori</th>
                                <th>Jumlah</th>
                                <th>Tanggal</th>
                                <th>Penerima</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState
                                            icon={Receipt}
                                            title="Belum ada data belanja"
                                            description="Klik tombol 'Tambah Belanja' untuk mulai mencatat pengeluaran desa"
                                            actionLabel={canWrite ? "Tambah Belanja" : undefined}
                                            onAction={canWrite ? openNew : undefined}
                                            compact
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, idx) => {
                                    const itemCount = getItemCountForExpense(item.id);
                                    const isExpanded = expandedExpenseId === item.id;
                                    const items = isExpanded ? getItemsForExpense(item.id) : [];
                                    return (
                                    <React.Fragment key={item.id}>
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                                        <td>
                                            <span style={{
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                letterSpacing: '0.5px',
                                                background: 'var(--bg-tertiary)',
                                                color: 'var(--primary-500)',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-secondary)',
                                            }}>
                                                {item.norek || '-'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>
                                            {item.uraian}
                                            {itemCount > 0 && (
                                                <span className="expense-item-badge" style={{ marginLeft: '8px' }}>{itemCount} detail</span>
                                            )}
                                        </td>
                                        <td><span className="badge badge-warning">{item.kategori}</span></td>
                                        <td style={{ fontWeight: 600, color: 'var(--danger-500)' }}>{formatRupiah(item.jumlah)}</td>
                                        <td>{formatShortDate(item.tanggal)}</td>
                                        <td>{item.penerima}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm expense-detail-toggle"
                                                    onClick={() => setExpandedExpenseId(isExpanded ? null : item.id)}
                                                    title={isExpanded ? 'Tutup detail' : 'Lihat detail'}
                                                    style={{ color: isExpanded ? 'var(--primary-500)' : undefined }}
                                                >
                                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                </button>
                                                {canWrite && (
                                                    <>
                                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(item)} title="Edit" disabled={saving}>
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(item.id)} title="Hapus" style={{ color: 'var(--danger-500)' }} disabled={saving}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                    {/* ── Expandable detail panel ── */}
                                    {isExpanded && (
                                        <tr className="expense-items-panel">
                                            <td colSpan={7} style={{ padding: 0 }}>
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    style={{ overflow: 'hidden', background: 'var(--bg-secondary)', borderBottom: '2px solid var(--primary-200)', padding: '12px 16px' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            <FileText size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                            Detail Kuitansi & HOK — {item.uraian}
                                                        </span>
                                                        {canWrite && (
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button className="btn btn-outline btn-sm" onClick={() => openNewItem(item.id, 'kuitansi')}>
                                                                    <Receipt size={14} /> + Kuitansi
                                                                </button>
                                                                <button className="btn btn-outline btn-sm" onClick={() => openNewItem(item.id, 'hok')}>
                                                                    <Users size={14} /> + HOK
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {items.length === 0 ? (
                                                        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                                                            Belum ada detail kuitansi / HOK untuk belanja ini.
                                                        </div>
                                                    ) : (
                                                        <table className="table" style={{ fontSize: '0.82rem', margin: 0 }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Tipe</th>
                                                                    <th>Tanggal</th>
                                                                    <th>Uraian</th>
                                                                    <th>Dibayar Kepada</th>
                                                                    <th>Vol × Satuan</th>
                                                                    <th>Jumlah</th>
                                                                    {canWrite && <th>Aksi</th>}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {items.map(ei => (
                                                                    <tr key={ei.id}>
                                                                        <td>
                                                                            <span className={`badge ${ei.tipe === 'hok' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                                                                                {ei.tipe === 'hok' ? 'HOK' : 'Kuitansi'}
                                                                            </span>
                                                                        </td>
                                                                        <td>{formatShortDate(ei.tanggal)}</td>
                                                                        <td>{ei.uraian || '-'}</td>
                                                                        <td>{ei.dibayar_kepada || '-'}</td>
                                                                        <td>{ei.volume} × {ei.satuan || '-'}</td>
                                                                        <td style={{ fontWeight: 600, color: 'var(--danger-500)' }}>{formatRupiah(ei.jumlah)}</td>
                                                                        {canWrite && (
                                                                            <td>
                                                                                <div className="table-actions">
                                                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditItem(ei)} title="Edit"><Edit2 size={13} /></button>
                                                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDeleteItem(ei.id)} title="Hapus" style={{ color: 'var(--danger-500)' }}><Trash2 size={13} /></button>
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
                        <motion.div className="modal" initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ duration: 0.25 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">{editing ? 'Edit Belanja' : 'Tambah Belanja Baru'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                            </div>
                            <div className="modal-body">
                                {/* Bidang & Sub Bidang */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Bidang *</label>
                                        <select className="form-input form-select" value={form.kategori} onChange={e => handleKategoriChange(e.target.value)}>
                                            {budgetCategories.map(c => (
                                                <option key={c} value={c}>{bidangStructure[c]?.norek}. {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sub Bidang</label>
                                        <select className="form-input form-select" value={form.sub_bidang} onChange={e => setForm(p => ({ ...p, sub_bidang: e.target.value }))}>
                                            <option value="">Pilih Sub Bidang</option>
                                            {availableSubBidang.map(sb => (
                                                <option key={sb.nama} value={sb.nama}>{sb.norek} — {sb.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* KOREK & Uraian */}
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: '0 0 160px' }}>
                                        <label className="form-label">KOREK</label>
                                        <input
                                            className="form-input"
                                            value={form.norek || ''}
                                            onChange={e => setForm(p => ({ ...p, norek: e.target.value }))}
                                            placeholder="cth: 1.1.01"
                                            style={{
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                textAlign: 'center',
                                                letterSpacing: '1px',
                                            }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Uraian Belanja *</label>
                                        <input className="form-input" value={form.uraian} onChange={e => setForm(p => ({ ...p, uraian: e.target.value }))} placeholder="Contoh: Pembangunan Jalan Desa" />
                                    </div>
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

                                {/* Penerima */}
                                <div className="form-group">
                                    <label className="form-label">Penerima</label>
                                    <input className="form-input" value={form.penerima} onChange={e => setForm(p => ({ ...p, penerima: e.target.value }))} placeholder="Nama penerima/vendor" />
                                </div>
                                {/* ── Bukti Transaksi (saat edit) ── */}
                                {editing && (
                                    <div className="form-group" style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: '16px', marginTop: '8px' }}>
                                        <label className="form-label" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>🧾 Bukti Transaksi</label>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px' }}>
                                            Upload scan kuitansi, nota pembelian, atau bukti transfer (JPG, PNG, PDF — maks 3MB)
                                        </span>
                                        <FileUpload
                                            entityType="belanja"
                                            entityId={editing.id}
                                        />
                                    </div>
                                )}
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
                title="Hapus Belanja?"
                message="Data belanja ini akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan."
                loading={saving}
            />

            {/* ── Expense Item Modal ── */}
            <AnimatePresence>
                {showItemModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowItemModal(false)}>
                        <motion.div className="modal" initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ duration: 0.25 }} style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">
                                    {editingItem ? 'Edit ' : 'Tambah '}
                                    {itemForm.tipe === 'hok' ? 'Data HOK / Pekerja' : 'Detail Kuitansi'}
                                </div>
                                <button className="modal-close" onClick={() => setShowItemModal(false)}><X size={16} /></button>
                            </div>
                            <div className="modal-body">
                                {/* Tipe switch */}
                                <div className="form-group">
                                    <label className="form-label">Tipe</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className={`btn btn-sm ${itemForm.tipe === 'kuitansi' ? 'btn-primary' : 'btn-outline'}`}
                                            type="button"
                                            onClick={() => setItemForm(p => ({ ...p, tipe: 'kuitansi' }))}
                                        >
                                            <Receipt size={14} /> Kuitansi
                                        </button>
                                        <button
                                            className={`btn btn-sm ${itemForm.tipe === 'hok' ? 'btn-primary' : 'btn-outline'}`}
                                            type="button"
                                            onClick={() => setItemForm(p => ({ ...p, tipe: 'hok' }))}
                                        >
                                            <Users size={14} /> HOK
                                        </button>
                                    </div>
                                </div>
                                {/* Uraian & Tanggal */}
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Uraian</label>
                                        <input className="form-input" value={itemForm.uraian} onChange={e => setItemForm(p => ({ ...p, uraian: e.target.value }))} placeholder="Uraian pekerjaan / item" />
                                    </div>
                                    <div className="form-group" style={{ flex: '0 0 150px' }}>
                                        <label className="form-label">Tanggal</label>
                                        <input className="form-input" type="date" value={itemForm.tanggal} onChange={e => setItemForm(p => ({ ...p, tanggal: e.target.value }))} />
                                    </div>
                                </div>
                                {/* Dibayar Kepada & NIK */}
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">{itemForm.tipe === 'hok' ? 'Nama Pekerja' : 'Dibayar Kepada'}</label>
                                        <input className="form-input" value={itemForm.dibayar_kepada} onChange={e => setItemForm(p => ({ ...p, dibayar_kepada: e.target.value }))} placeholder={itemForm.tipe === 'hok' ? 'Nama lengkap pekerja' : 'Nama penerima'} />
                                    </div>
                                    {itemForm.tipe === 'hok' && (
                                        <div className="form-group" style={{ flex: '0 0 180px' }}>
                                            <label className="form-label">NIK</label>
                                            <input className="form-input" value={itemForm.nik} onChange={e => setItemForm(p => ({ ...p, nik: e.target.value }))} placeholder="NIK pekerja" />
                                        </div>
                                    )}
                                </div>
                                {/* Volume, Satuan, Harga Satuan */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Volume</label>
                                        <input className="form-input" type="number" value={itemForm.volume} onChange={e => setItemForm(p => handleItemAutoCalc('volume', e.target.value, p))} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Satuan</label>
                                        <input className="form-input" value={itemForm.satuan} onChange={e => setItemForm(p => ({ ...p, satuan: e.target.value }))} placeholder={itemForm.tipe === 'hok' ? 'HOK' : 'Ls / Unit / Kg'} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Harga Satuan</label>
                                        <input className="form-input" type="number" value={itemForm.harga_satuan} onChange={e => setItemForm(p => handleItemAutoCalc('harga_satuan', e.target.value, p))} placeholder="0" />
                                    </div>
                                </div>
                                {/* Jumlah (auto-calculated) */}
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Jumlah (Rp) — otomatis</label>
                                        <input className="form-input" type="number" value={itemForm.jumlah} onChange={e => setItemForm(p => ({ ...p, jumlah: e.target.value }))} style={{ fontWeight: 700, color: 'var(--danger-500)' }} />
                                    </div>
                                </div>
                                {/* Keterangan */}
                                <div className="form-group">
                                    <label className="form-label">Keterangan</label>
                                    <input className="form-input" value={itemForm.keterangan} onChange={e => setItemForm(p => ({ ...p, keterangan: e.target.value }))} placeholder="Catatan tambahan (opsional)" />
                                </div>
                                {/* Activity link (optional) */}
                                {state.activities?.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Link ke Kegiatan (opsional)</label>
                                        <select className="form-input form-select" value={itemForm.activity_id} onChange={e => setItemForm(p => ({ ...p, activity_id: e.target.value }))}>
                                            <option value="">— Tanpa kegiatan —</option>
                                            {state.activities.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowItemModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handleItemSubmit} disabled={savingItem}>
                                    {savingItem ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {editingItem ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Item Dialog */}
            <ConfirmDialog
                open={!!confirmDeleteItem}
                onClose={() => setConfirmDeleteItem(null)}
                onConfirm={handleDeleteItem}
                title="Hapus Detail Item?"
                message="Detail kuitansi / HOK ini akan dihapus. Tindakan ini tidak dapat dibatalkan."
                loading={savingItem}
            />
        </motion.div>
    );
}
