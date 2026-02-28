import { motion } from 'framer-motion';
import { BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatRupiah, budgetCategories } from '../data/sampleData';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';

export default function RealisasiAnggaran() {
    const { state, loading } = useApp();
    const { expenses, activities } = state;

    if (loading) return <PageLoadingSkeleton type="cards" />;

    // Build realization data: aggregate activities by bidang
    const bidangData = {};
    (activities || []).forEach(act => {
        const bidang = act.bidang || 'Lainnya';
        if (!bidangData[bidang]) bidangData[bidang] = { anggaran: 0, realisasi: 0 };
        bidangData[bidang].anggaran += Number(act.anggaran || 0);
        bidangData[bidang].realisasi += Number(act.realisasi || 0);
    });

    const realizationData = Object.entries(bidangData).map(([kategori, d]) => {
        const sisa = d.anggaran - d.realisasi;
        const persen = d.anggaran > 0 ? ((d.realisasi / d.anggaran) * 100).toFixed(1) : 0;
        return { kategori, anggaran: d.anggaran, realisasi: d.realisasi, sisa, persen: Number(persen) };
    }).filter(d => d.anggaran > 0);

    const totalAnggaran = realizationData.reduce((s, d) => s + d.anggaran, 0);
    const totalRealisasi = realizationData.reduce((s, d) => s + d.realisasi, 0);
    const totalPersen = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : 0;

    const chartData = realizationData.map(d => ({
        name: d.kategori.length > 20 ? d.kategori.substring(0, 18) + '...' : d.kategori,
        Anggaran: d.anggaran,
        Realisasi: d.realisasi,
    }));

    const progressColor = (p) => {
        if (p >= 90) return 'green';
        if (p >= 70) return 'blue';
        if (p >= 40) return 'amber';
        return 'red';
    };

    const statusLabel = (p) => {
        if (p >= 95) return { text: 'Sangat Baik', badge: 'badge-success' };
        if (p >= 80) return { text: 'Baik', badge: 'badge-info' };
        if (p >= 50) return { text: 'Cukup', badge: 'badge-warning' };
        return { text: 'Rendah', badge: 'badge-danger' };
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Summary Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                <motion.div className="stat-card balance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-icon balance"><BarChart3 /></div>
                    <div className="stat-label">Total Anggaran</div>
                    <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatRupiah(totalAnggaran)}</div>
                </motion.div>
                <motion.div className="stat-card income" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="stat-icon income"><ArrowUpRight /></div>
                    <div className="stat-label">Total Realisasi</div>
                    <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatRupiah(totalRealisasi)}</div>
                </motion.div>
                <motion.div className="stat-card activities" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="stat-icon activities"><BarChart3 /></div>
                    <div className="stat-label">Persentase Realisasi</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{totalPersen}%</div>
                </motion.div>
            </div>

            {/* Chart */}
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <div>
                        <div className="card-title">Perbandingan Anggaran vs Realisasi</div>
                        <div className="card-subtitle">Per bidang pengeluaran</div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                boxShadow: 'var(--shadow-lg)',
                            }}
                            formatter={(v) => formatRupiah(v)}
                        />
                        <Bar dataKey="Anggaran" fill="var(--primary-400)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                        <Bar dataKey="Realisasi" fill="var(--accent-400)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary-400)' }} />
                        Anggaran
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-400)' }} />
                        Realisasi
                    </div>
                </div>
            </motion.div>

            {/* Detail Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '20px 24px 0' }}>
                        <div className="card-title">Detail Realisasi per Bidang</div>
                        <div className="card-subtitle">Progres penyerapan anggaran</div>
                    </div>
                    <div style={{ padding: '16px 24px 24px' }}>
                        {realizationData.map((d, idx) => {
                            const status = statusLabel(d.persen);
                            return (
                                <motion.div
                                    key={d.kategori}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.08 }}
                                    style={{
                                        padding: '16px 0',
                                        borderBottom: idx < realizationData.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{d.kategori}</span>
                                            <span className={`badge ${status.badge}`} style={{ marginLeft: '10px' }}>{status.text}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{d.persen}%</span>
                                    </div>
                                    <div className="progress-bar" style={{ marginBottom: '8px' }}>
                                        <motion.div
                                            className={`progress-fill ${progressColor(d.persen)}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(d.persen, 100)}%` }}
                                            transition={{ duration: 1, delay: 0.5 + idx * 0.15, ease: [0.4, 0, 0.2, 1] }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        <span>Anggaran: <strong style={{ color: 'var(--text-secondary)' }}>{formatRupiah(d.anggaran)}</strong></span>
                                        <span>Realisasi: <strong style={{ color: 'var(--accent-500)' }}>{formatRupiah(d.realisasi)}</strong></span>
                                        <span>Sisa: <strong style={{ color: 'var(--text-secondary)' }}>{formatRupiah(d.sisa)}</strong></span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
