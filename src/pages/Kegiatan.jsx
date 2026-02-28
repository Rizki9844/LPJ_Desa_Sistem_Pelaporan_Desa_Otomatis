import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FileUpload from '../components/ui/FileUpload';
import { budgetCategories, bidangStructure } from '../data/sampleData';
import { supabase } from '../lib/supabase';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import NorekBadge from '../components/Kegiatan/NorekBadge';
import { useRole } from '../hooks/useRole';

// Level Views
import BidangOverview from '../components/Kegiatan/BidangOverview';
import SubBidangView from '../components/Kegiatan/SubBidangView';
import KegiatanList from '../components/Kegiatan/KegiatanList';

const emptyForm = {
    nama: '', bidang: 'Penyelenggaraan Pemerintahan', sub_bidang: '', norek: '', status: 'direncanakan',
    jenis_lpj: 'fisik', progres: 0, anggaran: '', realisasi: '', pelaksana: '', mulai: '', selesai: '',
    lokasi: '', waktu_pelaksanaan: '',
};

export default function Kegiatan() {
    const { state, dispatch, loading, activeTahun } = useApp();
    const { addToast } = useToast();
    const { canWrite } = useRole();

    // Navigation
    const [selectedBidang, setSelectedBidang] = useState(null);
    const [selectedSubBidang, setSelectedSubBidang] = useState(null);
    const [viewAll, setViewAll] = useState(false);

    // Kegiatan modal
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [filterStatus, setFilterStatus] = useState('');
    const [saving, setSaving] = useState(false);

    // Sub Bidang modal
    const [showSbModal, setShowSbModal] = useState(false);
    const [editingSb, setEditingSb] = useState(null);
    const [sbForm, setSbForm] = useState({ nama: '', norek: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [confirmDeleteAct, setConfirmDeleteAct] = useState(null);

    // Attachment counts per kegiatan
    const [attachCounts, setAttachCounts] = useState({});

    // Load attachment counts
    useEffect(() => {
        async function loadCounts() {
            try {
                const { data } = await supabase
                    .from('attachments')
                    .select('entity_id')
                    .eq('entity_type', 'kegiatan')
                    .eq('tahun_anggaran', activeTahun);
                if (data) {
                    const counts = {};
                    data.forEach(r => { counts[r.entity_id] = (counts[r.entity_id] || 0) + 1; });
                    setAttachCounts(counts);
                }
            } catch (err) { console.error('Load attach counts:', err); }
        }
        if (!loading) loadCounts();
    }, [loading]);

    // Get sub bidang list with full objects (id, nama, norek)
    const getSubBidangObjects = (bidang) => state.subBidang?.[bidang] || [];
    const getSubBidangList = (bidang) => getSubBidangObjects(bidang).map(sb => sb.nama);

    // Get bidang norek
    const getBidangNorek = (bidangName) => bidangStructure[bidangName]?.norek || '';

    // Get sub bidang norek from state
    const getSubBidangNorek = (bidang, sbName) => {
        const sbObj = getSubBidangObjects(bidang).find(sb => sb.nama === sbName);
        return sbObj?.norek || '';
    };

    // Computed stats per bidang
    const bidangStats = useMemo(() => {
        const stats = {};
        budgetCategories.forEach(b => {
            const items = state.activities.filter(a => a.bidang === b);
            stats[b] = {
                total: items.length,
                selesai: items.filter(a => a.status === 'selesai').length,
                berjalan: items.filter(a => a.status === 'berjalan').length,
                direncanakan: items.filter(a => a.status === 'direncanakan').length,
                anggaran: items.reduce((s, a) => s + a.anggaran, 0),
                realisasi: items.reduce((s, a) => s + a.realisasi, 0),
            };
        });
        return stats;
    }, [state.activities]);

    // Current filtered activities
    const currentActivities = useMemo(() => {
        let items = state.activities;
        if (!viewAll && selectedBidang) {
            items = items.filter(a => a.bidang === selectedBidang);
            if (selectedSubBidang) {
                items = items.filter(a => a.sub_bidang === selectedSubBidang);
            }
        }
        if (filterStatus) {
            items = items.filter(a => a.status === filterStatus);
        }
        // Sort by norek
        items = [...items].sort((a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true }));
        return items;
    }, [state.activities, selectedBidang, selectedSubBidang, viewAll, filterStatus]);

    // Sub bidang stats
    const subBidangStats = useMemo(() => {
        if (!selectedBidang) return {};
        const items = state.activities.filter(a => a.bidang === selectedBidang);
        const stats = {};
        const sbList = getSubBidangList(selectedBidang);
        sbList.forEach(sb => {
            const sbItems = items.filter(a => a.sub_bidang === sb);
            stats[sb] = {
                total: sbItems.length,
                selesai: sbItems.filter(a => a.status === 'selesai').length,
                berjalan: sbItems.filter(a => a.status === 'berjalan').length,
                direncanakan: sbItems.filter(a => a.status === 'direncanakan').length,
                anggaran: sbItems.reduce((s, a) => s + a.anggaran, 0),
                realisasi: sbItems.reduce((s, a) => s + a.realisasi, 0),
            };
        });
        return stats;
    }, [state.activities, selectedBidang, state.subBidang]);

    // ── Navigation ──
    const navigateToBidang = (bidang) => { setSelectedBidang(bidang); setSelectedSubBidang(null); setViewAll(false); setFilterStatus(''); };
    const navigateToSubBidang = (sb) => { setSelectedSubBidang(sb); setFilterStatus(''); };
    const navigateBack = () => {
        if (selectedSubBidang) setSelectedSubBidang(null);
        else if (selectedBidang) setSelectedBidang(null);
        else setViewAll(false);
        setFilterStatus('');
    };
    const navigateToAll = () => { setViewAll(true); setSelectedBidang(null); setSelectedSubBidang(null); setFilterStatus(''); };

    // ── Kegiatan CRUD ──
    const openNew = () => {
        const defaultForm = { ...emptyForm };
        if (selectedBidang) {
            defaultForm.bidang = selectedBidang;
            const sbList = getSubBidangList(selectedBidang);
            if (selectedSubBidang) defaultForm.sub_bidang = selectedSubBidang;
            else if (sbList.length) defaultForm.sub_bidang = sbList[0];
        }
        setEditing(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ ...item, anggaran: String(item.anggaran), realisasi: String(item.realisasi), progres: String(item.progres) });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.nama || !form.anggaran) { addToast('Nama kegiatan dan anggaran harus diisi!', 'error'); return; }
        if (!form.sub_bidang) { addToast('Sub bidang harus dipilih!', 'error'); return; }
        if (!form.pelaksana) { addToast('Pelaksana harus diisi!', 'error'); return; }
        if (form.mulai && form.selesai && form.selesai < form.mulai) {
            addToast('Tanggal selesai tidak boleh sebelum tanggal mulai!', 'error');
            return;
        }
        if (Number(form.realisasi || 0) > Number(form.anggaran)) {
            addToast('⚠️ Realisasi melebihi anggaran!', 'warning');
        }
        setSaving(true);
        try {
            const payload = {
                nama: form.nama, bidang: form.bidang, sub_bidang: form.sub_bidang,
                norek: form.norek, status: form.status, jenis_lpj: form.jenis_lpj || 'fisik',
                progres: Number(form.progres || 0),
                anggaran: Number(form.anggaran), realisasi: Number(form.realisasi || 0),
                pelaksana: form.pelaksana, mulai: form.mulai, selesai: form.selesai,
                lokasi: form.lokasi || '', waktu_pelaksanaan: form.waktu_pelaksanaan || '',
            };
            if (editing) {
                const { error } = await supabase.from('activities').update(payload).eq('id', editing.id);
                if (error) throw error;
                dispatch({ type: 'UPDATE_ACTIVITY', payload: { ...payload, id: editing.id } });
                addToast('Kegiatan berhasil diperbarui!', 'success');
            } else {
                const { data, error } = await supabase.from('activities').insert({ ...payload, tahun_anggaran: activeTahun }).select().single();
                if (error) throw error;
                dispatch({ type: 'ADD_ACTIVITY', payload: data });
                addToast('Kegiatan baru berhasil ditambahkan!', 'success');
            }
            setShowModal(false);
        } catch (err) {
            console.error('Save activity error:', err);
            addToast(`Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteAct) return;
        setSaving(true);
        try {
            // ── Cleanup attachments (cascade) ──
            const { data: attachments } = await supabase
                .from('attachments')
                .select('id, file_url')
                .eq('entity_type', 'kegiatan')
                .eq('entity_id', confirmDeleteAct);

            if (attachments?.length) {
                // Remove files from Storage
                const storagePaths = attachments
                    .map(a => {
                        const parts = a.file_url.split('/storage/v1/object/public/lampiran/');
                        return parts[1] ? decodeURIComponent(parts[1]) : null;
                    })
                    .filter(Boolean);
                if (storagePaths.length) {
                    await supabase.storage.from('lampiran').remove(storagePaths);
                }
                // Remove DB records
                await supabase.from('attachments').delete()
                    .eq('entity_type', 'kegiatan').eq('entity_id', confirmDeleteAct);
            }

            const { error } = await supabase.from('activities').delete().eq('id', confirmDeleteAct);
            if (error) throw error;
            dispatch({ type: 'DELETE_ACTIVITY', payload: confirmDeleteAct });
            setAttachCounts(prev => { const n = { ...prev }; delete n[confirmDeleteAct]; return n; });
            addToast('Kegiatan berhasil dihapus', 'warning');
        } catch (err) {
            console.error('Delete activity error:', err);
            addToast(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setSaving(false);
            setConfirmDeleteAct(null);
        }
    };

    // ── Sub Bidang CRUD ──
    const openNewSb = () => {
        setEditingSb(null);
        // Auto-suggest next norek
        const bidangNorek = getBidangNorek(selectedBidang);
        const sbObjs = getSubBidangObjects(selectedBidang);
        const nextIdx = sbObjs.length + 1;
        const suggestedNorek = `${bidangNorek}.${nextIdx}`;
        setSbForm({ nama: '', norek: suggestedNorek });
        setShowSbModal(true);
    };

    const openEditSb = (sb, e) => {
        e.stopPropagation();
        const sbItem = getSubBidangObjects(selectedBidang).find(s => s.nama === sb);
        if (sbItem) {
            setEditingSb(sbItem);
            setSbForm({ nama: sbItem.nama, norek: sbItem.norek || '' });
            setShowSbModal(true);
        }
    };

    const handleSubmitSb = async () => {
        if (!sbForm.nama.trim()) { addToast('Nama sub bidang harus diisi!', 'error'); return; }
        const sbList = getSubBidangList(selectedBidang);
        const isDuplicate = sbList.some(n => n.toLowerCase() === sbForm.nama.trim().toLowerCase() && (!editingSb || editingSb.nama.toLowerCase() !== sbForm.nama.trim().toLowerCase()));
        if (isDuplicate) { addToast('Sub bidang dengan nama tersebut sudah ada!', 'error'); return; }

        setSaving(true);
        try {
            if (editingSb) {
                const payload = { nama: sbForm.nama.trim(), norek: sbForm.norek.trim() };
                const { error } = await supabase.from('sub_bidang').update(payload).eq('id', editingSb.id);
                if (error) throw error;

                // Also update activities that reference the old name
                if (editingSb.nama !== sbForm.nama.trim()) {
                    await supabase.from('activities').update({ sub_bidang: sbForm.nama.trim() })
                        .eq('bidang', selectedBidang).eq('sub_bidang', editingSb.nama);
                }

                dispatch({
                    type: 'UPDATE_SUB_BIDANG',
                    payload: { bidang: selectedBidang, id: editingSb.id, nama: sbForm.nama.trim(), norek: sbForm.norek.trim(), oldNama: editingSb.nama },
                });
                addToast('Sub bidang berhasil diperbarui!', 'success');
            } else {
                const { data, error } = await supabase.from('sub_bidang')
                    .insert({ bidang: selectedBidang, nama: sbForm.nama.trim(), norek: sbForm.norek.trim(), tahun_anggaran: activeTahun })
                    .select().single();
                if (error) throw error;

                dispatch({
                    type: 'ADD_SUB_BIDANG',
                    payload: { bidang: selectedBidang, nama: data.nama, norek: data.norek || '', id: data.id },
                });
                addToast('Sub bidang baru berhasil ditambahkan!', 'success');
            }
            setShowSbModal(false);
        } catch (err) {
            console.error('Save sub bidang error:', err);
            addToast(`Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteSb = (sb, e) => {
        e.stopPropagation();
        setShowDeleteConfirm(sb);
    };

    const handleDeleteSb = async () => {
        const sbItem = getSubBidangObjects(selectedBidang).find(s => s.nama === showDeleteConfirm);
        if (sbItem) {
            setSaving(true);
            try {
                // ── Cascade: cleanup attachments for all activities in this sub-bidang ──
                const affectedActivities = state.activities.filter(
                    a => a.bidang === selectedBidang && a.sub_bidang === showDeleteConfirm
                );
                const activityIds = affectedActivities.map(a => a.id);

                if (activityIds.length > 0) {
                    // Fetch all attachments for these activities
                    const { data: attachments } = await supabase
                        .from('attachments')
                        .select('id, file_url')
                        .eq('entity_type', 'kegiatan')
                        .in('entity_id', activityIds);

                    if (attachments?.length) {
                        // Remove files from Supabase Storage
                        const storagePaths = attachments
                            .map(a => {
                                const parts = a.file_url.split('/storage/v1/object/public/lampiran/');
                                return parts[1] ? decodeURIComponent(parts[1]) : null;
                            })
                            .filter(Boolean);
                        if (storagePaths.length) {
                            await supabase.storage.from('lampiran').remove(storagePaths);
                        }
                        // Remove attachment DB records
                        await supabase.from('attachments').delete()
                            .eq('entity_type', 'kegiatan')
                            .in('entity_id', activityIds);
                    }
                }

                // Delete related activities from Supabase
                await supabase.from('activities').delete()
                    .eq('bidang', selectedBidang).eq('sub_bidang', showDeleteConfirm);

                // Delete sub bidang from Supabase
                const { error } = await supabase.from('sub_bidang').delete().eq('id', sbItem.id);
                if (error) throw error;

                const actCount = affectedActivities.length;
                dispatch({
                    type: 'DELETE_SUB_BIDANG',
                    payload: { bidang: selectedBidang, id: sbItem.id, nama: showDeleteConfirm },
                });
                addToast(`Sub bidang "${showDeleteConfirm}" beserta ${actCount} kegiatan berhasil dihapus`, 'warning');
            } catch (err) {
                console.error('Delete sub bidang error:', err);
                addToast(`Gagal menghapus: ${err.message}`, 'error');
            } finally {
                setSaving(false);
            }
        }
        setShowDeleteConfirm(null);
    };

    const progressColor = (p) => {
        if (p >= 100) return 'green';
        if (p >= 50) return 'blue';
        if (p > 0) return 'amber';
        return 'red';
    };

    const availableSubBidang = getSubBidangList(form.bidang);

    // ───────────── LOADING STATE ─────────────
    if (loading) return <PageLoadingSkeleton type="cards" />;

    // ── Determine view ──
    const renderCurrentView = () => {
        if (viewAll || selectedSubBidang) {
            return (
                <KegiatanList
                    activities={state.activities}
                    villageInfo={state.villageInfo}
                    currentActivities={currentActivities}
                    selectedBidang={selectedBidang}
                    selectedSubBidang={selectedSubBidang}
                    viewAll={viewAll}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    navigateBack={navigateBack}
                    setSelectedBidang={setSelectedBidang}
                    setSelectedSubBidang={setSelectedSubBidang}
                    setViewAll={setViewAll}
                    getBidangNorek={getBidangNorek}
                    getSubBidangNorek={getSubBidangNorek}
                    openNew={openNew}
                    saving={saving}
                    openEdit={openEdit}
                    setConfirmDeleteAct={setConfirmDeleteAct}
                    attachCounts={attachCounts}
                    canWrite={canWrite}
                />
            );
        }
        if (selectedBidang) {
            return (
                <SubBidangView
                    selectedBidang={selectedBidang}
                    activities={state.activities}
                    villageInfo={state.villageInfo}
                    bidangStats={bidangStats}
                    subBidangStats={subBidangStats}
                    getSubBidangObjects={getSubBidangObjects}
                    navigateBack={navigateBack}
                    navigateToSubBidang={navigateToSubBidang}
                    setSelectedBidang={setSelectedBidang}
                    setSelectedSubBidang={setSelectedSubBidang}
                    setViewAll={setViewAll}
                    openEditSb={openEditSb}
                    confirmDeleteSb={confirmDeleteSb}
                    openNewSb={openNewSb}
                    canWrite={canWrite}
                />
            );
        }
        return (
            <BidangOverview
                activities={state.activities}
                villageInfo={state.villageInfo}
                bidangStats={bidangStats}
                getSubBidangList={getSubBidangList}
                navigateToAll={navigateToAll}
                navigateToBidang={navigateToBidang}
            />
        );
    };

    return (
        <>
            <AnimatePresence mode="wait">
                <motion.div key={`${selectedBidang}-${selectedSubBidang}-${viewAll}`}>
                    {renderCurrentView()}
                </motion.div>
            </AnimatePresence>

            {/* ── Kegiatan Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
                        <motion.div className="modal" style={{ maxWidth: '640px' }} initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ duration: 0.25 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">{editing ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nama Kegiatan *</label>
                                    <input className="form-input" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Contoh: Pembangunan Jalan Desa" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Bidang</label>
                                        <select className="form-input form-select" value={form.bidang} onChange={e => {
                                            const newBidang = e.target.value;
                                            const subs = getSubBidangList(newBidang);
                                            setForm(p => ({ ...p, bidang: newBidang, sub_bidang: subs[0] || '' }));
                                        }}>
                                            {budgetCategories.map(c => (
                                                <option key={c} value={c}>{bidangStructure[c]?.norek}. {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sub Bidang *</label>
                                        <select className="form-input form-select" value={form.sub_bidang} onChange={e => setForm(p => ({ ...p, sub_bidang: e.target.value }))}>
                                            <option value="">Pilih Sub Bidang</option>
                                            {getSubBidangObjects(form.bidang).map(sb => (
                                                <option key={sb.nama} value={sb.nama}>{sb.norek} — {sb.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* KOREK */}
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
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-input form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                            <option value="direncanakan">Direncanakan</option>
                                            <option value="berjalan">Berjalan</option>
                                            <option value="selesai">Selesai</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Jenis LPJ */}
                                <div className="form-group">
                                    <label className="form-label">Jenis LPJ *</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            style={{
                                                flex: 1,
                                                background: form.jenis_lpj === 'fisik' ? '#dbeafe' : 'var(--bg-secondary)',
                                                color: form.jenis_lpj === 'fisik' ? '#1d4ed8' : 'var(--text-tertiary)',
                                                border: `2px solid ${form.jenis_lpj === 'fisik' ? '#3b82f6' : 'var(--border-secondary)'}`,
                                                fontWeight: form.jenis_lpj === 'fisik' ? 700 : 400,
                                                padding: '10px 12px',
                                                borderRadius: 'var(--radius-md)',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => setForm(p => ({ ...p, jenis_lpj: 'fisik' }))}
                                        >
                                            🔨 Fisik (Infrastruktur)
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            style={{
                                                flex: 1,
                                                background: form.jenis_lpj === 'non_fisik' ? '#fef3c7' : 'var(--bg-secondary)',
                                                color: form.jenis_lpj === 'non_fisik' ? '#92400e' : 'var(--text-tertiary)',
                                                border: `2px solid ${form.jenis_lpj === 'non_fisik' ? '#f59e0b' : 'var(--border-secondary)'}`,
                                                fontWeight: form.jenis_lpj === 'non_fisik' ? 700 : 400,
                                                padding: '10px 12px',
                                                borderRadius: 'var(--radius-md)',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => setForm(p => ({ ...p, jenis_lpj: 'non_fisik' }))}
                                        >
                                            📋 Non-Fisik (Program)
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                                        {form.jenis_lpj === 'fisik'
                                            ? 'LPJ Fisik: Pengecoran, pembangunan, renovasi → Menghasilkan 15 dokumen'
                                            : 'LPJ Non-Fisik: Pelatihan, pengadaan barang/jasa, BLT → Menghasilkan 7 dokumen'
                                        }
                                    </span>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Anggaran (Rp) *</label>
                                        <input className="form-input" type="number" value={form.anggaran} onChange={e => setForm(p => ({ ...p, anggaran: e.target.value }))} placeholder="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Realisasi (Rp)</label>
                                        <input className="form-input" type="number" value={form.realisasi} onChange={e => setForm(p => ({ ...p, realisasi: e.target.value }))} placeholder="0" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Progres (%)</label>
                                        <input className="form-input" type="number" min="0" max="100" value={form.progres} onChange={e => setForm(p => ({ ...p, progres: e.target.value }))} placeholder="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Pelaksana</label>
                                        <input className="form-input" value={form.pelaksana} onChange={e => setForm(p => ({ ...p, pelaksana: e.target.value }))} placeholder="Nama pelaksana/vendor" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Tanggal Mulai</label>
                                        <input className="form-input" type="date" value={form.mulai} onChange={e => setForm(p => ({ ...p, mulai: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tanggal Selesai</label>
                                        <input className="form-input" type="date" value={form.selesai} onChange={e => setForm(p => ({ ...p, selesai: e.target.value }))} />
                                    </div>
                                </div>
                                {/* Lokasi & Waktu Pelaksanaan */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Lokasi Kegiatan</label>
                                        <input className="form-input" value={form.lokasi || ''} onChange={e => setForm(p => ({ ...p, lokasi: e.target.value }))} placeholder="Contoh: Dusun Mekar, RT 03/RW 01" />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                                            Kosongkan untuk menggunakan alamat desa sebagai default
                                        </span>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Waktu Pelaksanaan</label>
                                        <input className="form-input" value={form.waktu_pelaksanaan || ''} onChange={e => setForm(p => ({ ...p, waktu_pelaksanaan: e.target.value }))} placeholder="Contoh: 30 Hari Kalender" />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                                            Durasi pelaksanaan kegiatan
                                        </span>
                                    </div>
                                </div>
                                {/* ── Lampiran Bukti (hanya saat edit) ── */}
                                {editing && (
                                    <div className="form-group" style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: '16px', marginTop: '8px' }}>
                                        <label className="form-label" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>📎 Lampiran Bukti</label>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px' }}>
                                            Upload foto kuitansi, nota, dokumentasi kegiatan (JPG, PNG, PDF — maks 3MB)
                                        </span>
                                        <FileUpload
                                            entityType="kegiatan"
                                            entityId={editing.id}
                                            onCountChange={(count) => setAttachCounts(prev => ({ ...prev, [editing.id]: count }))}
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
            </AnimatePresence >

            {/* ── Sub Bidang Modal ── */}
            < AnimatePresence >
                {showSbModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSbModal(false)}>
                        <motion.div className="modal" style={{ maxWidth: '440px' }} initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ duration: 0.25 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">{editingSb ? 'Edit Sub Bidang' : 'Tambah Sub Bidang Baru'}</div>
                                <button className="modal-close" onClick={() => setShowSbModal(false)}><X size={16} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Bidang: <NorekBadge norek={getBidangNorek(selectedBidang)} size="sm" color={bidangStructure[selectedBidang]?.color} /> <strong style={{ color: 'var(--text-primary)' }}>{selectedBidang}</strong>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: '0 0 120px' }}>
                                        <label className="form-label">KOREK</label>
                                        <input
                                            className="form-input"
                                            value={sbForm.norek}
                                            onChange={e => setSbForm(p => ({ ...p, norek: e.target.value }))}
                                            placeholder="cth: 1.1"
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
                                        <label className="form-label">Nama Sub Bidang *</label>
                                        <input
                                            className="form-input"
                                            value={sbForm.nama}
                                            onChange={e => setSbForm(p => ({ ...p, nama: e.target.value }))}
                                            placeholder="Contoh: Pekerjaan Umum & Penataan Ruang"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowSbModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handleSubmitSb} disabled={saving}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {editingSb ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )
                }
            </AnimatePresence >

            {/* ── Delete Sub Bidang Confirmation ── */}
            < ConfirmDialog
                open={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDeleteSb}
                title={`Hapus Sub Bidang "${showDeleteConfirm}"?`}
                message={`Semua kegiatan (${state.activities.filter(a => a.bidang === selectedBidang && a.sub_bidang === showDeleteConfirm).length} kegiatan) dalam sub bidang ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                loading={saving}
            />

            {/* ── Delete Kegiatan Confirmation ── */}
            < ConfirmDialog
                open={!!confirmDeleteAct}
                onClose={() => setConfirmDeleteAct(null)}
                onConfirm={handleDelete}
                title="Hapus Kegiatan?"
                message="Data kegiatan ini akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan."
                loading={saving}
            />
        </>
    );
}
