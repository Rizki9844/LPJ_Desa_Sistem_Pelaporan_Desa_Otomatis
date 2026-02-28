/**
 * ================================================================
 * FileUpload Component — Drag & Drop + Staging Area
 * ================================================================
 * Professional file upload with:
 *   - Drag & drop zone with visual feedback
 *   - **Staging Area**: files are queued before upload
 *   - Each staged file gets a "Nama Dokumen" input
 *   - Upload progress indicator
 *   - File size validation (3MB max)
 *   - Delete from Storage + DB
 *   - Inline keterangan (description) edit for uploaded files
 *   - Rollback on partial upload failure
 *   - Lazy loading thumbnails
 *   - Duplicate file detection
 *
 * Props:
 *   entityType: 'kegiatan' | 'belanja'
 *   entityId: number (ID of the kegiatan/belanja)
 *   onCountChange: (count) => void (callback to update badge)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, FileText, Trash2, Download, Loader2, Paperclip, Edit3, Check, ListPlus, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from './Toast';
import { useApp } from '../../context/AppContext';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const BUCKET = 'lampiran';

export default function FileUpload({ entityType, entityId, onCountChange }) {
    const { addToast } = useToast();
    const { activeTahun } = useApp();
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [stagedFiles, setStagedFiles] = useState([]); // { file, preview, keterangan }
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null);
    const [editingKet, setEditingKet] = useState(null); // { id, value }

    // ── Load existing attachments ──
    const loadAttachments = useCallback(async () => {
        if (!entityId) { setLoading(false); return; }
        try {
            const { data, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('uploaded_at', { ascending: true });
            if (error) {
                console.error('Load attachments error:', error);
                setFiles([]);
            } else {
                setFiles(data || []);
                onCountChange?.(data?.length || 0);
            }
        } catch (err) {
            console.error('Load attachments error:', err);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId, onCountChange]);

    useEffect(() => { loadAttachments(); }, [loadAttachments]);

    // ── Stage files (add to pending list, don't upload yet) ──
    const stageFiles = (fileList) => {
        if (!entityId) {
            addToast('Simpan data terlebih dahulu sebelum mengunggah lampiran.', 'warning');
            return;
        }

        const validFiles = Array.from(fileList).filter(f => {
            if (f.size > MAX_FILE_SIZE) {
                addToast(`File "${f.name}" terlalu besar (max 3MB).`, 'error');
                return false;
            }
            if (!ACCEPTED_TYPES.includes(f.type)) {
                addToast(`Format "${f.name}" tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.`, 'error');
                return false;
            }
            // Dedupe check against existing uploaded files
            const isDup = files.some(ex => ex.file_name === f.name && ex.file_size === f.size);
            if (isDup) {
                addToast(`File "${f.name}" sudah ada (nama & ukuran sama).`, 'warning');
                return false;
            }
            // Dedupe check against already staged files
            const isStagedDup = stagedFiles.some(sf => sf.file.name === f.name && sf.file.size === f.size);
            if (isStagedDup) {
                addToast(`File "${f.name}" sudah ada di daftar antrian.`, 'warning');
                return false;
            }
            return true;
        });

        if (!validFiles.length) return;

        const newStaged = validFiles.map((file, idx) => {
            let preview = null;
            if (file.type.startsWith('image/')) {
                preview = URL.createObjectURL(file);
            }
            // Auto-suggest keterangan: "Dokumen {next number}"
            const nextNo = files.length + stagedFiles.length + idx + 1;
            return {
                id: `staged-${Date.now()}-${idx}`,
                file,
                preview,
                keterangan: `Dokumen ${nextNo}`,
            };
        });

        setStagedFiles(prev => [...prev, ...newStaged]);
    };

    // ── Remove a staged file ──
    const removeStagedFile = (stagedId) => {
        setStagedFiles(prev => {
            const removed = prev.find(s => s.id === stagedId);
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return prev.filter(s => s.id !== stagedId);
        });
    };

    // ── Update staged file keterangan ──
    const updateStagedKeterangan = (stagedId, value) => {
        setStagedFiles(prev => prev.map(s => s.id === stagedId ? { ...s, keterangan: value } : s));
    };

    // ── Upload all staged files ──
    const handleUploadAll = async () => {
        if (!stagedFiles.length) return;

        // Validate: each file must have a keterangan
        const emptyKet = stagedFiles.some(s => !s.keterangan.trim());
        if (emptyKet) {
            addToast('Setiap file harus memiliki nama/keterangan dokumen sebelum diunggah.', 'error');
            return;
        }

        setUploading(true);
        let uploadedCount = 0;

        try {
            for (const staged of stagedFiles) {
                const { file, keterangan } = staged;
                const ts = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const storagePath = `${entityType}/${entityId}/${ts}_${safeName}`;

                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET)
                    .upload(storagePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) {
                    if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
                        addToast(`Bucket "${BUCKET}" tidak ditemukan. Pastikan nama bucket persis "${BUCKET}".`, 'error');
                    }
                    throw uploadError;
                }

                // Get public URL
                const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
                const publicUrl = urlData?.publicUrl || '';

                // Save metadata to DB
                const { error: dbError } = await supabase.from('attachments').insert({
                    entity_type: entityType,
                    entity_id: entityId,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_size: file.size,
                    file_type: file.type,
                    keterangan: keterangan.trim(),
                    tahun_anggaran: activeTahun,
                });

                if (dbError) {
                    // Rollback: remove file from Storage if DB insert fails
                    await supabase.storage.from(BUCKET).remove([storagePath]);
                    throw dbError;
                }

                uploadedCount++;
            }

            addToast(`${uploadedCount} file berhasil diunggah!`, 'success');
            // Cleanup staged previews
            stagedFiles.forEach(s => { if (s.preview) URL.revokeObjectURL(s.preview); });
            setStagedFiles([]);
            await loadAttachments();
        } catch (err) {
            console.error('Upload error:', err);
            addToast(`Gagal mengunggah: ${err.message}`, 'error');
            // Reload to show any partially uploaded files
            if (uploadedCount > 0) {
                // Remove successfully uploaded from staged
                setStagedFiles(prev => prev.slice(uploadedCount));
                await loadAttachments();
            }
        } finally {
            setUploading(false);
        }
    };

    // ── Delete handler ──
    const handleDelete = async (attachment) => {
        if (!window.confirm(`Hapus file "${attachment.file_name}"?`)) return;
        try {
            const urlParts = attachment.file_url.split(`/storage/v1/object/public/${BUCKET}/`);
            const storagePath = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;

            if (storagePath) {
                await supabase.storage.from(BUCKET).remove([storagePath]);
            }

            const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
            if (error) throw error;

            addToast('File berhasil dihapus.', 'warning');
            await loadAttachments();
        } catch (err) {
            console.error('Delete error:', err);
            addToast(`Gagal menghapus: ${err.message}`, 'error');
        }
    };

    // ── Save keterangan (inline edit for already-uploaded files) ──
    const saveKeterangan = async (id) => {
        if (!editingKet) return;
        try {
            const { error } = await supabase
                .from('attachments')
                .update({ keterangan: editingKet.value })
                .eq('id', id);
            if (error) throw error;
            setFiles(prev => prev.map(f => f.id === id ? { ...f, keterangan: editingKet.value } : f));
            setEditingKet(null);
        } catch (err) {
            console.error('Save keterangan error:', err);
            addToast('Gagal menyimpan keterangan', 'error');
        }
    };

    // ── Drag handlers ──
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) stageFiles(e.dataTransfer.files);
    };

    const handleInputChange = (e) => {
        if (e.target.files?.length) stageFiles(e.target.files);
        e.target.value = '';
    };

    const formatSize = (bytes) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isImage = (type) => type?.startsWith('image/');

    return (
        <div className="file-upload-wrapper">
            {/* Drop Zone */}
            <div
                className={`file-upload-dropzone ${dragActive ? 'file-upload-dropzone--active' : ''} ${uploading ? 'file-upload-dropzone--uploading' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                />
                {uploading ? (
                    <div className="file-upload-status">
                        <Loader2 size={28} className="file-upload-spinner" />
                        <span>Mengunggah file...</span>
                    </div>
                ) : (
                    <div className="file-upload-status">
                        <Upload size={28} style={{ color: dragActive ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                        <span style={{ fontWeight: 600 }}>
                            {dragActive ? 'Lepaskan file di sini' : 'Seret file atau klik untuk memilih'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            JPG, PNG, WebP, PDF • Maks 3MB per file
                        </span>
                    </div>
                )}
            </div>

            {/* ── Staging Area (Pending Files) ── */}
            {stagedFiles.length > 0 && (
                <div className="file-upload-staging">
                    <div className="file-upload-staging-header">
                        <ListPlus size={16} />
                        <span>{stagedFiles.length} file siap diunggah — isi nama dokumen terlebih dahulu</span>
                    </div>
                    <div className="file-upload-staging-list">
                        {stagedFiles.map((staged, idx) => (
                            <div key={staged.id} className="file-upload-staging-item">
                                {/* Thumbnail preview */}
                                <div className="file-upload-thumb file-upload-thumb--staged">
                                    {staged.preview ? (
                                        <img src={staged.preview} alt={staged.file.name} />
                                    ) : (
                                        <FileText size={22} style={{ color: '#ef4444' }} />
                                    )}
                                </div>
                                {/* Info + Keterangan Input */}
                                <div className="file-upload-staging-info">
                                    <div className="file-upload-staging-filename">
                                        <span className="file-upload-name" title={staged.file.name}>{staged.file.name}</span>
                                        <span className="file-upload-meta">{formatSize(staged.file.size)}</span>
                                    </div>
                                    <input
                                        className="file-upload-staging-input"
                                        value={staged.keterangan}
                                        onChange={e => updateStagedKeterangan(staged.id, e.target.value)}
                                        placeholder={`cth: ${idx + 1}. Nota Belanja ATK`}
                                        autoFocus={idx === stagedFiles.length - 1}
                                    />
                                </div>
                                {/* Remove */}
                                <button
                                    className="file-upload-btn file-upload-btn--danger"
                                    title="Batalkan"
                                    onClick={() => removeStagedFile(staged.id)}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-primary file-upload-staging-upload-btn"
                        onClick={handleUploadAll}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 size={16} className="file-upload-spinner" />
                        ) : (
                            <ArrowUpCircle size={16} />
                        )}
                        {uploading ? 'Mengunggah...' : `Unggah ${stagedFiles.length} File`}
                    </button>
                </div>
            )}

            {/* ── Uploaded File List ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                    <Loader2 size={16} className="file-upload-spinner" style={{ display: 'inline-block', marginRight: '6px' }} />
                    Memuat lampiran...
                </div>
            ) : files.length > 0 ? (
                <div className="file-upload-list">
                    <div className="file-upload-list-header">
                        <Paperclip size={13} />
                        <span>{files.length} dokumen terlampir</span>
                    </div>
                    {files.map((f, idx) => (
                        <div key={f.id} className="file-upload-item">
                            {/* Order number */}
                            <div className="file-upload-order">{idx + 1}</div>
                            {/* Thumbnail / Icon */}
                            <div
                                className="file-upload-thumb"
                                onClick={() => isImage(f.file_type) ? setLightbox(f) : window.open(f.file_url, '_blank')}
                            >
                                {isImage(f.file_type) ? (
                                    <img src={f.file_url} alt={f.file_name} loading="lazy" />
                                ) : (
                                    <FileText size={24} style={{ color: '#ef4444' }} />
                                )}
                            </div>

                            {/* Info */}
                            <div className="file-upload-info">
                                {/* Keterangan: inline edit */}
                                {editingKet?.id === f.id ? (
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        <input
                                            className="file-upload-ket-input"
                                            value={editingKet.value}
                                            onChange={e => setEditingKet({ id: f.id, value: e.target.value })}
                                            onKeyDown={e => { if (e.key === 'Enter') saveKeterangan(f.id); if (e.key === 'Escape') setEditingKet(null); }}
                                            placeholder="Nama dokumen..."
                                            autoFocus
                                        />
                                        <button className="file-upload-btn" title="Simpan" onClick={() => saveKeterangan(f.id)}>
                                            <Check size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <span
                                        className="file-upload-ket-display"
                                        onClick={(e) => { e.stopPropagation(); setEditingKet({ id: f.id, value: f.keterangan || '' }); }}
                                        title="Klik untuk edit nama dokumen"
                                        style={{ fontWeight: 600, fontSize: '0.82rem' }}
                                    >
                                        {f.keterangan || f.file_name}
                                        {' '}<Edit3 size={9} style={{ display: 'inline', opacity: 0.4 }} />
                                    </span>
                                )}
                                <span className="file-upload-meta">
                                    {f.file_name} • {formatSize(f.file_size)} • {new Date(f.uploaded_at).toLocaleDateString('id-ID')}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="file-upload-actions">
                                <button
                                    className="file-upload-btn"
                                    title="Download"
                                    onClick={() => window.open(f.file_url, '_blank')}
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    className="file-upload-btn file-upload-btn--danger"
                                    title="Hapus"
                                    onClick={() => handleDelete(f)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                stagedFiles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                        <Paperclip size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                        Belum ada lampiran
                    </div>
                )
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="file-upload-lightbox" onClick={() => setLightbox(null)}>
                    <button className="file-upload-lightbox-close" onClick={() => setLightbox(null)}>
                        <X size={24} />
                    </button>
                    <img src={lightbox.file_url} alt={lightbox.file_name} onClick={e => e.stopPropagation()} />
                    <div className="file-upload-lightbox-caption">
                        {lightbox.keterangan || lightbox.file_name}
                    </div>
                </div>
            )}
        </div>
    );
}
