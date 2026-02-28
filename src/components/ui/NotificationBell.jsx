import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, Calendar, TrendingUp, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * NotificationBell — Real-time notification bell in Header.
 * Computes notifications from existing data in AppContext, no extra DB table needed.
 */
export default function NotificationBell() {
    const { state, activeTahun } = useApp();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Compute notifications from data
    const notifications = useMemo(() => {
        const items = [];
        const vi = state.villageInfo || {};
        const now = new Date();

        // 1. Data wajib kosong
        if (!vi.nama_desa) {
            items.push({
                id: 'no-nama-desa',
                type: 'error',
                icon: AlertCircle,
                title: 'Nama Desa belum diisi',
                desc: 'Lengkapi di halaman Informasi Desa',
                action: () => navigate('/informasi-desa'),
            });
        }
        const pejabat = vi.pejabat_desa || [];
        const hasKades = pejabat.some(p => p.jabatan.toLowerCase().includes('kepala desa'));
        const hasBendahara = pejabat.some(p => p.jabatan.toLowerCase().includes('bendahara') || p.jabatan.toLowerCase().includes('keuangan'));

        if (!hasKades) {
            items.push({
                id: 'no-kades',
                type: 'error',
                icon: AlertCircle,
                title: 'Kepala Desa belum diisi',
                desc: 'Tambahkan pejabat di Informasi Desa',
                action: () => navigate('/informasi-desa'),
            });
        }
        if (!hasBendahara) {
            items.push({
                id: 'no-bendahara',
                type: 'warning',
                icon: AlertCircle,
                title: 'Bendahara belum diisi',
                desc: 'Tambahkan pejabat di Informasi Desa',
                action: () => navigate('/informasi-desa'),
            });
        }

        // 2. Kegiatan lambat (progres < 50% dengan deadline mendekati)
        (state.activities || []).forEach(act => {
            if (act.selesai && act.progres < 50) {
                const deadline = new Date(act.selesai);
                const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 30 && daysLeft > 0) {
                    items.push({
                        id: `slow-${act.id}`,
                        type: 'warning',
                        icon: AlertTriangle,
                        title: `"${act.nama}" progres baru ${act.progres}%`,
                        desc: `Deadline ${daysLeft} hari lagi`,
                        action: () => navigate('/kegiatan'),
                    });
                }
            }
        });

        // 3. Anggaran melebihi
        (state.activities || []).forEach(act => {
            if (act.realisasi > act.anggaran && act.anggaran > 0) {
                items.push({
                    id: `over-${act.id}`,
                    type: 'error',
                    icon: TrendingUp,
                    title: `"${act.nama}" melebihi anggaran`,
                    desc: `Realisasi melebihi anggaran sebesar ${((act.realisasi / act.anggaran - 1) * 100).toFixed(0)}%`,
                    action: () => navigate('/kegiatan'),
                });
            }
        });

        // 4. Deadline LPJ semester
        const month = now.getMonth(); // 0-based
        if (month === 5) { // Juni — deadline Semester I
            items.push({
                id: 'deadline-s1',
                type: 'info',
                icon: Calendar,
                title: 'Deadline LPJ Semester I',
                desc: 'Pastikan laporan Semester I sudah lengkap',
                action: () => navigate('/generate-lpj'),
            });
        }
        if (month === 11) { // Desember — deadline Semester II
            items.push({
                id: 'deadline-s2',
                type: 'info',
                icon: Calendar,
                title: 'Deadline LPJ Semester II',
                desc: 'Pastikan laporan akhir tahun sudah lengkap',
                action: () => navigate('/generate-lpj'),
            });
        }

        // 5. Belum ada kegiatan
        if ((state.activities || []).length === 0) {
            items.push({
                id: 'no-activities',
                type: 'warning',
                icon: AlertTriangle,
                title: 'Belum ada kegiatan',
                desc: `Tambahkan kegiatan untuk TA ${activeTahun}`,
                action: () => navigate('/kegiatan'),
            });
        }

        return items;
    }, [state, activeTahun, navigate]);

    const count = notifications.length;

    const typeStyles = {
        error: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
        warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
        info: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                className="header-btn"
                onClick={() => setOpen(!open)}
                title="Notifikasi"
                style={{ position: 'relative' }}
            >
                <Bell size={20} />
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: '4px', right: '4px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#ef4444', color: 'white',
                        fontSize: '0.6rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg-primary)',
                    }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="notification-dropdown"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="notification-header">
                            <span>Notifikasi</span>
                            {count > 0 && (
                                <span className="notification-count-badge">{count}</span>
                            )}
                            <button className="notification-close" onClick={() => setOpen(false)}>
                                <X size={14} />
                            </button>
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="notification-empty">
                                    <Bell size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
                                    <p>Semua data sudah lengkap! 🎉</p>
                                </div>
                            ) : (
                                notifications.map(n => {
                                    const style = typeStyles[n.type] || typeStyles.info;
                                    return (
                                        <button
                                            key={n.id}
                                            className="notification-item"
                                            onClick={() => { n.action(); setOpen(false); }}
                                            style={{ borderLeft: `3px solid ${style.color}` }}
                                        >
                                            <div className="notification-icon" style={{ background: style.bg, color: style.color }}>
                                                <n.icon size={14} />
                                            </div>
                                            <div className="notification-body">
                                                <div className="notification-title">{n.title}</div>
                                                <div className="notification-desc">{n.desc}</div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
