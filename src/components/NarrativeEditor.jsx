/**
 * ================================================================
 * NarrativeEditor — Editor Konten Naratif Buku Utama LPJ
 * ================================================================
 * Collapsible panel dengan textarea fields untuk setiap bagian
 * naratif LPJ. Data disimpan ke tabel lpj_narratives via Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Save, Loader2, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { useToast } from './ui/Toast';

const NARRATIVE_FIELDS = [
    {
        key: 'kata_pengantar',
        label: 'Kata Pengantar',
        placeholder: 'Tulis kata pengantar LPJ di sini. Jika dikosongkan, akan menggunakan template default.',
        rows: 5,
    },
    {
        key: 'latar_belakang',
        label: 'BAB I — Latar Belakang',
        placeholder: 'Tuliskan latar belakang penyusunan LPJ. Jika dikosongkan, akan menggunakan template default berisi penjelasan UU Desa dan kewajiban pelaporan.',
        rows: 5,
    },
    {
        key: 'tujuan_lpj',
        label: 'BAB I — Tujuan dan Sasaran',
        placeholder: 'Tuliskan tujuan penyusunan LPJ. Jika dikosongkan, akan menggunakan template default (4 poin tujuan).',
        rows: 4,
    },
    {
        key: 'dasar_hukum',
        label: 'BAB I — Dasar Hukum',
        placeholder: 'Daftar dasar hukum (1 per baris). Jika dikosongkan, akan menggunakan 6 dasar hukum standar (UU 6/2014, PP 43/2014, Permendagri 20/2018, dll).',
        rows: 6,
    },
    {
        key: 'realisasi_fisik_narasi',
        label: 'BAB II — Narasi Realisasi Fisik',
        placeholder: 'Tuliskan narasi pengantar tabel realisasi fisik kegiatan. Jika dikosongkan, akan menggunakan kalimat pengantar default.',
        rows: 4,
    },
    {
        key: 'realisasi_keuangan_narasi',
        label: 'BAB II — Narasi Realisasi Keuangan',
        placeholder: 'Tuliskan narasi pengantar realisasi keuangan. Jika dikosongkan, akan menggunakan kalimat pengantar default.',
        rows: 4,
    },
    {
        key: 'kendala',
        label: 'BAB III — Kendala dan Permasalahan',
        placeholder: 'Tuliskan kendala/permasalahan yang ditemui selama pelaksanaan APBDesa. Jika dikosongkan, akan menggunakan placeholder titik-titik.',
        rows: 4,
    },
    {
        key: 'saran',
        label: 'BAB III — Saran',
        placeholder: 'Tuliskan saran untuk perbaikan di tahun anggaran berikutnya. Jika dikosongkan, akan menggunakan placeholder titik-titik.',
        rows: 4,
    },
];

export default function NarrativeEditor({ disabled = false }) {
    const { state, dispatch, activeTahun } = useApp();
    const { addToast } = useToast();
    const [expanded, setExpanded] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Sync form with AppContext narratives
    useEffect(() => {
        const narr = state.lpjNarratives || {};
        const initial = {};
        NARRATIVE_FIELDS.forEach(f => {
            initial[f.key] = narr[f.key] || '';
        });
        setForm(initial);
        setIsDirty(false);
    }, [state.lpjNarratives]);

    const handleChange = useCallback((key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        if (!activeTahun) return;
        setSaving(true);
        try {
            const existingId = state.lpjNarratives?.id;
            const payload = {
                ...form,
                tahun_anggaran: activeTahun,
            };

            let result;
            if (existingId) {
                // Update existing
                const { data, error } = await supabase
                    .from('lpj_narratives')
                    .update(payload)
                    .eq('id', existingId)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('lpj_narratives')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }

            dispatch({ type: 'SET_LPJ_NARRATIVES', payload: result });
            setIsDirty(false);
            addToast('Konten naratif berhasil disimpan!', 'success');
        } catch (err) {
            console.error('Save narratives error:', err);
            addToast('Gagal menyimpan konten: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        const narr = state.lpjNarratives || {};
        const initial = {};
        NARRATIVE_FIELDS.forEach(f => {
            initial[f.key] = narr[f.key] || '';
        });
        setForm(initial);
        setIsDirty(false);
    };

    const filledCount = NARRATIVE_FIELDS.filter(f => (form[f.key] || '').trim().length > 0).length;

    return (
        <div className="narrative-editor">
            {/* Toggle Header */}
            <button
                className="narrative-editor-toggle"
                onClick={() => setExpanded(!expanded)}
                type="button"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        Editor Konten Naratif
                    </span>
                    <span className={`pilar-badge ${filledCount === NARRATIVE_FIELDS.length ? 'pilar-badge-ready' : 'pilar-badge-incomplete'}`}>
                        {filledCount}/{NARRATIVE_FIELDS.length} terisi
                    </span>
                </div>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Expanded Panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="narrative-editor-body">
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                Isi konten naratif untuk Buku Utama LPJ. Field yang dikosongkan akan menggunakan template default saat di-export ke Word.
                            </p>

                            {NARRATIVE_FIELDS.map(field => (
                                <div key={field.key} className="narrative-field-group">
                                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                        {field.label}
                                    </label>
                                    <textarea
                                        className="form-input narrative-field"
                                        rows={field.rows}
                                        placeholder={field.placeholder}
                                        value={form[field.key] || ''}
                                        onChange={e => handleChange(field.key, e.target.value)}
                                        disabled={disabled}
                                        style={{ fontFamily: "'Bookman Old Style', Georgia, serif" }}
                                    />
                                </div>
                            ))}

                            {/* Action Buttons */}
                            {!disabled && (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-secondary)' }}>
                                    {isDirty && (
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={handleReset}
                                            disabled={saving}
                                            type="button"
                                        >
                                            <RotateCcw size={15} />
                                            Reset
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSave}
                                        disabled={saving || !isDirty}
                                        type="button"
                                    >
                                        {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                                        {saving ? 'Menyimpan...' : 'Simpan Konten'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
