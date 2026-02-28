import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Wallet, ClipboardList,
    ArrowUpRight, ArrowDownRight, FileText, Plus,
    Receipt, Activity, Calendar,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/sampleData';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';

const pieColors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'];

function AnimatedCounter({ value, duration = 1500 }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        let start = 0;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) {
                ref.current = requestAnimationFrame(animate);
            }
        }

        ref.current = requestAnimationFrame(animate);
        return () => ref.current && cancelAnimationFrame(ref.current);
    }, [value, duration]);

    return <>{formatRupiah(display)}</>;
}

// ── Helper: get ISO week number ──
function getWeekNumber(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
}

// ── Helper: parse tanggal text to Date ──
function parseTanggal(tanggal) {
    if (!tanggal) return null;
    // Try native parse first (works for YYYY-MM-DD, ISO, etc.)
    let d = new Date(tanggal);
    if (!isNaN(d.getTime())) return d;
    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = tanggal.split(/[-/]/);
    if (parts.length === 3) {
        const [a, b, c] = parts;
        if (a.length === 4) {
            d = new Date(+a, +b - 1, +c); // YYYY-MM-DD
        } else {
            d = new Date(+c, +b - 1, +a); // DD-MM-YYYY
        }
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

// ── Helper: aggregate financial data by period ──
function aggregateTrendData(incomes, expenses, period) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const bucketMap = {};

    // Pre-fill buckets so the chart always has data points
    if (period === 'monthly') {
        // Always show all 12 months of the current year
        const year = new Date().getFullYear();
        monthNames.forEach((m, i) => {
            const sk = `${year}-${String(i).padStart(2, '0')}`;
            bucketMap[sk] = { label: m, Pendapatan: 0, Belanja: 0, sortKey: sk };
        });
    } else if (period === 'daily') {
        // Show last 30 days
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const dt = new Date(today);
            dt.setDate(dt.getDate() - i);
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const sk = `${dt.getFullYear()}-${mm}-${dd}`;
            bucketMap[sk] = { label: `${dd}/${mm}`, Pendapatan: 0, Belanja: 0, sortKey: sk };
        }
    } else if (period === 'weekly') {
        // Show last 12 weeks
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const dt = new Date(today);
            dt.setDate(dt.getDate() - i * 7);
            const wk = getWeekNumber(dt.toISOString());
            const yr = dt.getFullYear();
            const sk = `${yr}-${String(wk).padStart(2, '0')}`;
            if (!bucketMap[sk]) {
                bucketMap[sk] = { label: `Mgg ${wk}`, Pendapatan: 0, Belanja: 0, sortKey: sk };
            }
        }
    }

    const getKey = (tanggal) => {
        const d = parseTanggal(tanggal);
        if (!d) return null;

        if (period === 'daily') {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return { label: `${dd}/${mm}`, sortKey: `${d.getFullYear()}-${mm}-${dd}` };
        } else if (period === 'weekly') {
            const wk = getWeekNumber(d.toISOString());
            const yr = d.getFullYear();
            return { label: `Mgg ${wk}`, sortKey: `${yr}-${String(wk).padStart(2, '0')}` };
        } else {
            const mi = d.getMonth();
            const yr = d.getFullYear();
            return { label: monthNames[mi], sortKey: `${yr}-${String(mi).padStart(2, '0')}` };
        }
    };

    incomes.forEach(i => {
        const k = getKey(i.tanggal);
        if (k) {
            if (!bucketMap[k.sortKey]) bucketMap[k.sortKey] = { label: k.label, Pendapatan: 0, Belanja: 0, sortKey: k.sortKey };
            bucketMap[k.sortKey].Pendapatan += i.jumlah;
        }
    });

    expenses.forEach(e => {
        const k = getKey(e.tanggal);
        if (k) {
            if (!bucketMap[k.sortKey]) bucketMap[k.sortKey] = { label: k.label, Pendapatan: 0, Belanja: 0, sortKey: k.sortKey };
            bucketMap[k.sortKey].Belanja += e.jumlah;
        }
    });

    return Object.values(bucketMap)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ label, Pendapatan, Belanja }) => ({ bulan: label, Pendapatan, Belanja }));
}

const trendPeriods = [
    { key: 'daily', label: 'Harian' },
    { key: 'weekly', label: 'Mingguan' },
    { key: 'monthly', label: 'Bulanan' },
];

const trendSubtitles = {
    daily: 'Pendapatan vs Belanja per hari',
    weekly: 'Pendapatan vs Belanja per minggu',
    monthly: 'Pendapatan vs Belanja per bulan',
};

export default function Dashboard() {
    const { state, loading, activeTahun } = useApp();
    const { incomes, expenses, activities, pembiayaan } = state;
    const [trendPeriod, setTrendPeriod] = useState('monthly');

    const totalIncome = incomes.reduce((s, i) => s + Number(i.jumlah || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0);
    const totalPembiayaan = (pembiayaan || []).reduce((s, p) => s + Number(p.jumlah || 0), 0);
    const saldo = totalIncome - totalExpense;
    const totalActivities = activities.length;

    // Pie chart data by expense category
    const expenseByCategory = {};
    expenses.forEach(e => {
        expenseByCategory[e.kategori] = (expenseByCategory[e.kategori] || 0) + e.jumlah;
    });
    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    // Dynamic trend data based on selected period
    const trendData = useMemo(
        () => aggregateTrendData(incomes, expenses, trendPeriod),
        [incomes, expenses, trendPeriod]
    );

    // Recent activities (from real data, latest first)
    const statusColorMap = { selesai: 'green', berjalan: 'amber', direncanakan: 'blue' };
    const statusLabelMap = { selesai: 'Selesai', berjalan: 'Berjalan', direncanakan: 'Direncanakan' };
    const recentActivities = [...activities]
        .sort((a, b) => (b.id || 0) - (a.id || 0))
        .slice(0, 5);

    const containerVariants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
    };

    if (loading) return <PageLoadingSkeleton type="dashboard" />;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
            {/* Stats */}
            <div className="stats-grid">
                {[
                    { label: 'Total Pendapatan', value: totalIncome, icon: TrendingUp, type: 'income' },
                    { label: 'Total Belanja', value: totalExpense, icon: TrendingDown, type: 'expense' },
                    { label: 'Saldo', value: saldo, icon: Wallet, type: 'balance', change: saldo >= 0 ? 'Surplus' : 'Defisit', positive: saldo >= 0 },
                    { label: 'Jumlah Kegiatan', value: null, icon: ClipboardList, type: 'activities', count: totalActivities },
                ].map((stat, idx) => (
                    <motion.div key={idx} variants={itemVariants} className={`stat-card ${stat.type}`}>
                        <div className={`stat-icon ${stat.type}`}>
                            <stat.icon />
                        </div>
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-value">
                            {stat.value !== null ? (
                                <AnimatedCounter value={stat.value} />
                            ) : (
                                <span>{stat.count}</span>
                            )}
                        </div>
                        {stat.change && (
                            <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.change}
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="dashboard-grid">
                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">
                                <Calendar size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom', opacity: 0.6 }} />
                                Tren Keuangan
                            </div>
                            <div className="card-subtitle">{trendSubtitles[trendPeriod]}</div>
                        </div>
                        <div className="trend-period-toggle">
                            {trendPeriods.map(p => (
                                <button
                                    key={p.key}
                                    className={`trend-period-btn ${trendPeriod === p.key ? 'active' : ''}`}
                                    onClick={() => setTrendPeriod(p.key)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
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
                            <Area type="monotone" dataKey="Pendapatan" stroke="#10b981" strokeWidth={2.5} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="Belanja" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Distribusi Belanja</div>
                            <div className="card-subtitle">Berdasarkan bidang</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="45%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {pieData.map((_, idx) => (
                                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '10px',
                                    fontSize: '0.78rem',
                                    boxShadow: 'var(--shadow-lg)',
                                }}
                                formatter={(v) => formatRupiah(v)}
                            />
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="dashboard-grid">
                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <div className="card-title">Aktivitas Terbaru</div>
                    </div>
                    <div className="activity-list">
                        {recentActivities.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                Belum ada kegiatan. Tambahkan kegiatan di menu Kegiatan & Program.
                            </div>
                        ) : (
                            recentActivities.map((act, idx) => (
                                <motion.div
                                    key={act.id}
                                    className="activity-item"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.08 }}
                                >
                                    <div className={`activity-dot ${statusColorMap[act.status] || 'blue'}`} />
                                    <div>
                                        <div className="activity-text">
                                            <strong>{act.nama}</strong> — {statusLabelMap[act.status] || act.status}
                                            {act.bidang && <span style={{ color: 'var(--text-tertiary)' }}> • {act.bidang}</span>}
                                        </div>
                                        <div className="activity-time">
                                            {act.progres}% selesai • {formatRupiah(act.realisasi)} / {formatRupiah(act.anggaran)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card">
                    <div className="card-header">
                        <div className="card-title">Aksi Cepat</div>
                    </div>
                    <div className="quick-actions">
                        <Link to="/generate-lpj" className="quick-action-btn">
                            <div className="quick-action-icon purple"><FileText size={20} /></div>
                            <div>
                                <div className="quick-action-text">Generate LPJ</div>
                                <div className="quick-action-desc">Buat & ekspor laporan</div>
                            </div>
                        </Link>
                        <Link to="/pendapatan" className="quick-action-btn">
                            <div className="quick-action-icon green"><Plus size={20} /></div>
                            <div>
                                <div className="quick-action-text">Tambah Pendapatan</div>
                                <div className="quick-action-desc">Catat pemasukan baru</div>
                            </div>
                        </Link>
                        <Link to="/belanja" className="quick-action-btn">
                            <div className="quick-action-icon red"><Receipt size={20} /></div>
                            <div>
                                <div className="quick-action-text">Tambah Belanja</div>
                                <div className="quick-action-desc">Catat pengeluaran baru</div>
                            </div>
                        </Link>
                        <Link to="/kegiatan" className="quick-action-btn">
                            <div className="quick-action-icon amber"><Activity size={20} /></div>
                            <div>
                                <div className="quick-action-text">Kelola Kegiatan</div>
                                <div className="quick-action-desc">Update progres kegiatan</div>
                            </div>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
