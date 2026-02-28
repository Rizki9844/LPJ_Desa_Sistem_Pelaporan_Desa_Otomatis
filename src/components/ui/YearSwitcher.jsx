import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { bidangStructure } from '../../data/sampleData';

/**
 * YearSwitcher — Dropdown di Header untuk memilih tahun anggaran aktif.
 * Menampilkan tahun yang tersedia dari database + opsi tambah tahun baru.
 */
export default function YearSwitcher() {
    const { activeTahun, setActiveTahun, availableYears, fetchAvailableYears } = useApp();
    const { addToast } = useToast();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Create new year: copy sub_bidang from current year as template
    const handleCreateYear = async () => {
        const nextYear = (availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear()) + 1;

        // Check if already exists
        if (availableYears.includes(nextYear)) {
            addToast(`Tahun ${nextYear} sudah ada`, 'warning');
            return;
        }

        setCreating(true);
        try {
            // Copy sub_bidang from active year as template
            const { data: currentSubBidang } = await supabase
                .from('sub_bidang').select('bidang, nama, norek')
                .eq('tahun_anggaran', activeTahun).order('id');

            let seedData;
            if (currentSubBidang && currentSubBidang.length > 0) {
                seedData = currentSubBidang.map(sb => ({
                    bidang: sb.bidang,
                    nama: sb.nama,
                    norek: sb.norek || '',
                    tahun_anggaran: nextYear,
                }));
            } else {
                // Fallback: seed from bidangStructure
                seedData = [];
                Object.entries(bidangStructure).forEach(([bidang, config]) => {
                    config.subBidang.forEach(sb => {
                        seedData.push({
                            bidang,
                            nama: typeof sb === 'string' ? sb : sb.nama,
                            norek: typeof sb === 'string' ? '' : (sb.norek || ''),
                            tahun_anggaran: nextYear,
                        });
                    });
                });
            }

            const { error } = await supabase.from('sub_bidang').insert(seedData);
            if (error) throw error;

            await fetchAvailableYears();
            await setActiveTahun(nextYear);
            addToast(`Tahun Anggaran ${nextYear} berhasil dibuat!`, 'success');
        } catch (err) {
            console.error('Error creating new year:', err);
            addToast('Gagal membuat tahun baru: ' + err.message, 'error');
        } finally {
            setCreating(false);
            setOpen(false);
        }
    };

    const handleSelectYear = async (year) => {
        if (year === activeTahun) {
            setOpen(false);
            return;
        }
        setOpen(false);
        await setActiveTahun(year);
        addToast(`Beralih ke Tahun Anggaran ${year}`, 'info');
    };

    if (!activeTahun) return null;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                className="year-switcher-btn"
                onClick={() => setOpen(!open)}
                title="Ganti Tahun Anggaran"
            >
                <Calendar size={15} />
                <span className="year-switcher-label">TA {activeTahun}</span>
                <ChevronDown size={14} style={{
                    transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="year-switcher-dropdown"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="year-switcher-header">Tahun Anggaran</div>
                        <div className="year-switcher-list">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    className={`year-switcher-item ${year === activeTahun ? 'active' : ''}`}
                                    onClick={() => handleSelectYear(year)}
                                >
                                    <span>{year}</span>
                                    {year === activeTahun && <Check size={14} />}
                                </button>
                            ))}
                            {availableYears.length === 0 && (
                                <div className="year-switcher-empty">Belum ada data tahun</div>
                            )}
                        </div>
                        <div className="year-switcher-divider" />
                        <button
                            className="year-switcher-item year-switcher-add"
                            onClick={handleCreateYear}
                            disabled={creating}
                        >
                            {creating ? (
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Plus size={14} />
                            )}
                            <span>{creating ? 'Membuat...' : 'Tambah Tahun Baru'}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
