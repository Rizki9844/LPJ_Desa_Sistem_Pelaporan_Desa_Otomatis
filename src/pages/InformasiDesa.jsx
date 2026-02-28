import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, RotateCcw, Building2, MapPin, Phone, Mail, Globe, Users,
    Landmark, Calendar, CreditCard, Plus, Edit2, Trash2, X, UserCircle2,
    Hash, Map, Home, Briefcase, Loader2, Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { supabase } from '../lib/supabase';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import { useRole } from '../hooks/useRole';

export default function InformasiDesa() {
    const { state, dispatch, loading: appLoading } = useApp();
    const { addToast } = useToast();
    const { canWrite } = useRole();
    const [form, setForm] = useState({ ...state.villageInfo });
    const [saving, setSaving] = useState(false);

    // Pejabat modal
    const [showPejabatModal, setShowPejabatModal] = useState(false);
    const [editingPejabat, setEditingPejabat] = useState(null);
    const [confirmDeletePejabat, setConfirmDeletePejabat] = useState(null);
    const [pejabatForm, setPejabatForm] = useState({ jabatan: '', nama: '', nip: '' });

    // Sync form when state.villageInfo changes (e.g. after Supabase load)
    useEffect(() => {
        setForm({ ...state.villageInfo });
    }, [state.villageInfo]);

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // ── Save village info to Supabase ──
    const handleSave = async () => {
        // Area 3: Client-side validation for essential fields
        const requiredFields = [
            { key: 'nama_desa', label: 'Nama Desa' },
            { key: 'kode_desa', label: 'Kode Desa' },
            { key: 'alamat', label: 'Alamat Kantor Desa' },
            { key: 'kecamatan', label: 'Kecamatan' },
        ];

        const missingFields = requiredFields.filter(f => !form[f.key] || !form[f.key].trim());

        if (missingFields.length > 0) {
            const fieldNames = missingFields.map(f => f.label).join(', ');
            addToast(`Mohon lengkapi field wajib: ${fieldNames}`, 'error');
            return;
        }

        setSaving(true);
        try {
            // Prepare village_info data (exclude pejabat_desa array and legacy fields)
            const { pejabat_desa, kepala_desa, sekretaris_desa, bendahara, ...villageFields } = form;

            const { error } = await supabase
                .from('village_info')
                .upsert({ id: 1, ...villageFields }, { onConflict: 'id' });

            if (error) throw error;

            // Update local state
            dispatch({ type: 'SET_VILLAGE_INFO', payload: form });
            addToast('Data desa berhasil disimpan ke database!', 'success');
        } catch (err) {
            console.error('Save error:', err);
            addToast(`Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setForm({ ...state.villageInfo });
        addToast('Form direset ke data tersimpan', 'info');
    };

    // ── Pejabat CRUD (Supabase) ──
    const pejabatList = form.pejabat_desa || [];

    const openNewPejabat = () => {
        setEditingPejabat(null);
        setPejabatForm({ jabatan: '', nama: '', nip: '' });
        setShowPejabatModal(true);
    };

    const openEditPejabat = (p) => {
        setEditingPejabat(p);
        setPejabatForm({ jabatan: p.jabatan, nama: p.nama, nip: p.nip || '' });
        setShowPejabatModal(true);
    };

    const handleSubmitPejabat = async () => {
        if (!pejabatForm.jabatan.trim() || !pejabatForm.nama.trim()) {
            addToast('Jabatan dan nama harus diisi!', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editingPejabat) {
                // Update in Supabase
                const { error } = await supabase
                    .from('pejabat_desa')
                    .update({ jabatan: pejabatForm.jabatan.trim(), nama: pejabatForm.nama.trim(), nip: pejabatForm.nip.trim() })
                    .eq('id', editingPejabat.id);
                if (error) throw error;

                const updated = pejabatList.map(p =>
                    p.id === editingPejabat.id
                        ? { ...p, jabatan: pejabatForm.jabatan.trim(), nama: pejabatForm.nama.trim(), nip: pejabatForm.nip.trim() }
                        : p
                );
                setForm(prev => ({ ...prev, pejabat_desa: updated }));
                dispatch({ type: 'SET_VILLAGE_INFO', payload: { ...form, pejabat_desa: updated } });
                addToast('Pejabat berhasil diperbarui!', 'success');
            } else {
                // Insert into Supabase
                const { data, error } = await supabase
                    .from('pejabat_desa')
                    .insert({ jabatan: pejabatForm.jabatan.trim(), nama: pejabatForm.nama.trim(), nip: pejabatForm.nip.trim() })
                    .select()
                    .single();
                if (error) throw error;

                const updated = [...pejabatList, data];
                setForm(prev => ({ ...prev, pejabat_desa: updated }));
                dispatch({ type: 'SET_VILLAGE_INFO', payload: { ...form, pejabat_desa: updated } });
                addToast('Pejabat baru berhasil ditambahkan!', 'success');
            }
            setShowPejabatModal(false);
        } catch (err) {
            console.error('Pejabat save error:', err);
            addToast(`Gagal menyimpan pejabat: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePejabat = async () => {
        if (!confirmDeletePejabat) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('pejabat_desa')
                .delete()
                .eq('id', confirmDeletePejabat);
            if (error) throw error;

            const updated = pejabatList.filter(p => p.id !== confirmDeletePejabat);
            setForm(prev => ({ ...prev, pejabat_desa: updated }));
            dispatch({ type: 'SET_VILLAGE_INFO', payload: { ...form, pejabat_desa: updated } });
            addToast('Pejabat berhasil dihapus', 'warning');
        } catch (err) {
            console.error('Delete pejabat error:', err);
            addToast(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setSaving(false);
            setConfirmDeletePejabat(null);
        }
    };

    // Field with icon helper — returns JSX directly (not a component, avoids remount/focus loss)
    const renderField = (Icon, label, fieldKey, placeholder, type = 'text', required = false) => (
        <div className="form-group" key={fieldKey}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={14} style={{ color: 'var(--primary-400)', opacity: 0.8 }} />
                {label} {required && <span style={{ color: 'var(--danger-500)' }}>*</span>}
            </label>
            <input
                className="form-input"
                type={type}
                value={form[fieldKey] || ''}
                onChange={e => handleChange(fieldKey, e.target.value)}
                placeholder={placeholder}
                disabled={!canWrite}
            />
        </div>
    );

    // Section header component
    const SectionHeader = ({ icon: Icon, title, subtitle, color = 'var(--primary-500)' }) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '20px', paddingBottom: '14px',
            borderBottom: '2px solid var(--border-primary)',
        }}>
            <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                background: `${color}15`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={18} />
            </div>
            <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{subtitle}</div>}
            </div>
        </div>
    );

    // Loading state
    if (appLoading) return <PageLoadingSkeleton type="cards" />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {!canWrite && (
                <div className="readonly-banner">
                    <Eye size={18} />
                    <span>Mode Lihat Saja — Anda hanya memiliki akses untuk mengubah data ini.</span>
                </div>
            )}
            {/* Page Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}>
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Informasi Desa</h2>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                            Kelola data profil desa
                        </p>
                    </div>
                </div>
                {canWrite && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-outline" onClick={handleReset} disabled={saving}>
                            <RotateCcw size={16} /> Reset
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Menyimpan...' : 'Simpan Semua'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* ─── LEFT COLUMN ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Identitas Desa */}
                    <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <SectionHeader icon={Landmark} title="Identitas Desa" subtitle="Data identitas resmi pemerintah desa" color="#6366f1" />
                        <div className="form-row" style={{ marginBottom: '14px' }}>
                            {renderField(Home, 'Nama Desa', 'nama_desa', 'Masukkan nama desa', 'text', true)}
                            {renderField(Hash, 'Kode Desa', 'kode_desa', 'Kode Kemendagri', 'text', true)}
                        </div>
                        <div className="form-group" style={{ marginBottom: '14px' }}>
                            {renderField(MapPin, 'Alamat Kantor Desa', 'alamat', 'Jl. Raya ...', 'text', true)}
                        </div>
                        <div className="form-row-3">
                            {renderField(Map, 'Kecamatan', 'kecamatan', 'Kecamatan', 'text', true)}
                            {renderField(Map, 'Kabupaten/Kota', 'kabupaten', 'Kabupaten')}
                            {renderField(Map, 'Provinsi', 'provinsi', 'Provinsi')}
                        </div>
                    </motion.div>

                    {/* Kontak & Media */}
                    <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <SectionHeader icon={Phone} title="Kontak & Media" subtitle="Informasi kontak pemerintah desa" color="#10b981" />
                        <div className="form-row" style={{ marginBottom: '14px' }}>
                            {renderField(Phone, 'Telepon', 'telepon', '(022) xxx-xxxx')}
                            {renderField(Hash, 'Kode Pos', 'kode_pos', '40xxx')}
                        </div>
                        <div className="form-row">
                            {renderField(Mail, 'Email', 'email', 'desa@email.go.id', 'email')}
                            {renderField(Globe, 'Website', 'website', 'nama.desa.id')}
                        </div>
                    </motion.div>

                    {/* Rekening & Periode */}
                    <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <SectionHeader icon={Calendar} title="Keuangan & Periode" subtitle="Rekening desa dan periode pelaporan" color="#f59e0b" />
                        <div className="form-row" style={{ marginBottom: '14px' }}>
                            {renderField(CreditCard, 'No. Rekening Desa', 'no_rekening', 'xxxx-xxxx-xxxx')}
                            {renderField(Landmark, 'Nama Bank', 'nama_bank', 'Bank xxx')}
                        </div>
                        <div className="form-row">
                            {renderField(Calendar, 'Tahun Anggaran', 'tahun_anggaran', String(new Date().getFullYear()))}
                            {renderField(Calendar, 'Periode Laporan', 'periode', 'Semester I ...')}
                        </div>
                    </motion.div>
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Demografi */}
                    <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                        <SectionHeader icon={Users} title="Demografi Desa" subtitle="Data kependudukan dan wilayah" color="#0ea5e9" />
                        <div className="form-row" style={{ marginBottom: '14px' }}>
                            {renderField(Map, 'Luas Wilayah (Ha)', 'luas_wilayah', '0')}
                            {renderField(Users, 'Jumlah Penduduk', 'jumlah_penduduk', '0')}
                        </div>
                        <div className="form-row" style={{ marginBottom: '14px' }}>
                            {renderField(Home, 'Jumlah KK', 'jumlah_kk', '0')}
                            {renderField(Hash, 'Jumlah Dusun', 'jumlah_dusun', '0')}
                        </div>
                        <div className="form-row">
                            {renderField(Hash, 'Jumlah RT', 'jumlah_rt', '0')}
                            {renderField(Hash, 'Jumlah RW', 'jumlah_rw', '0')}
                        </div>
                    </motion.div>

                    {/* Pejabat Desa */}
                    <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid var(--border-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                                    background: '#f43f5e15', color: '#f43f5e',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Briefcase size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pejabat Desa</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{pejabatList.length} pejabat terdaftar</div>
                                </div>
                            </div>
                            {canWrite && (
                                <button className="btn btn-primary btn-sm" onClick={openNewPejabat} disabled={saving}>
                                    <Plus size={15} /> Tambah
                                </button>
                            )}
                        </div>

                        {/* Pejabat List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pejabatList.length === 0 ? (
                                <div className="empty-state" style={{ padding: '30px' }}>
                                    <div className="empty-state-icon"><UserCircle2 /></div>
                                    <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Belum ada pejabat</div>
                                    <div className="empty-state-desc">Klik tombol "Tambah" untuk menambahkan pejabat desa</div>
                                </div>
                            ) : (
                                pejabatList.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-primary)',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: 'var(--radius-full)',
                                            background: idx === 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                                                idx === 1 ? 'linear-gradient(135deg, #10b981, #34d399)' :
                                                    idx === 2 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' :
                                                        'linear-gradient(135deg, var(--text-tertiary), var(--text-secondary))',
                                            color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {p.nama.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.85rem', fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>
                                                {p.nama}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 600,
                                                    color: idx < 3 ? '#6366f1' : 'var(--text-tertiary)',
                                                    background: idx < 3 ? '#6366f112' : 'var(--bg-tertiary)',
                                                    padding: '1px 8px', borderRadius: '99px',
                                                }}>{p.jabatan}</span>
                                                {p.nip && (
                                                    <span style={{
                                                        fontSize: '0.68rem', color: 'var(--text-tertiary)',
                                                        fontFamily: 'monospace',
                                                    }}>NIP: {p.nip}</span>
                                                )}
                                            </div>
                                        </div>
                                        {canWrite && (
                                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditPejabat(p)} title="Edit" disabled={saving}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDeletePejabat(p.id)} title="Hapus" style={{ color: 'var(--danger-500)' }} disabled={saving}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom save bar */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    marginTop: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
                    border: '1px solid var(--border-primary)',
                }}
            >
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                    Data profil desa tersimpan dengan aman di server desa.
                </div>
                {canWrite && (
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                        <button className="btn btn-outline" onClick={handleReset} disabled={saving}>
                            <RotateCcw size={16} /> Reset
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Menyimpan...' : 'Simpan Semua Data'}
                        </button>
                    </div>
                )}
            </motion.div>

            {/* ── Pejabat Modal ── */}
            <AnimatePresence>
                {showPejabatModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPejabatModal(false)}>
                        <motion.div className="modal" style={{ maxWidth: '480px' }} initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ duration: 0.25 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">{editingPejabat ? 'Edit Pejabat' : 'Tambah Pejabat Baru'}</div>
                                <button className="modal-close" onClick={() => setShowPejabatModal(false)}><X size={16} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: '14px' }}>
                                    <label className="form-label">Jabatan *</label>
                                    <input
                                        className="form-input"
                                        value={pejabatForm.jabatan}
                                        onChange={e => setPejabatForm(p => ({ ...p, jabatan: e.target.value }))}
                                        placeholder="Contoh: Kepala Desa, Sekretaris Desa, Kaur Keuangan"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '14px' }}>
                                    <label className="form-label">Nama Lengkap *</label>
                                    <input
                                        className="form-input"
                                        value={pejabatForm.nama}
                                        onChange={e => setPejabatForm(p => ({ ...p, nama: e.target.value }))}
                                        placeholder="Nama lengkap beserta gelar"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">NIP</label>
                                    <input
                                        className="form-input"
                                        value={pejabatForm.nip}
                                        onChange={e => setPejabatForm(p => ({ ...p, nip: e.target.value }))}
                                        placeholder="Nomor Induk Pegawai (opsional)"
                                        style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowPejabatModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handleSubmitPejabat} disabled={saving}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {editingPejabat ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Pejabat */}
            <ConfirmDialog
                open={!!confirmDeletePejabat}
                onClose={() => setConfirmDeletePejabat(null)}
                onConfirm={handleDeletePejabat}
                title="Hapus Pejabat?"
                message="Data pejabat ini akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan."
                loading={saving}
            />
        </motion.div>
    );
}
