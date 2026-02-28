import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Search, Filter, ChevronDown, ChevronUp,
    Plus, Edit2, Trash2, Clock, User, Database,
    RefreshCw, Loader2, ShieldAlert,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRole } from '../hooks/useRole';
import EmptyState from '../components/ui/EmptyState';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';

const ACTION_CONFIG = {
    INSERT: { label: 'Tambah', icon: Plus, className: 'audit-action-insert' },
    UPDATE: { label: 'Ubah', icon: Edit2, className: 'audit-action-update' },
    DELETE: { label: 'Hapus', icon: Trash2, className: 'audit-action-delete' },
};

const TABLE_LABELS = {
    village_info: 'Informasi Desa',
    pejabat_desa: 'Pejabat Desa',
    incomes: 'Pendapatan',
    expenses: 'Belanja',
    activities: 'Kegiatan',
    sub_bidang: 'Sub Bidang',
    pembiayaan: 'Pembiayaan',
};

function formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatRelative(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return '';
}

function DiffViewer({ oldData, newData }) {
    if (!oldData && !newData) return <span className="audit-diff-empty">Tidak ada data</span>;

    const allKeys = [...new Set([
        ...Object.keys(oldData || {}),
        ...Object.keys(newData || {}),
    ])].filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');

    const changes = allKeys
        .map(key => {
            const oldVal = oldData?.[key];
            const newVal = newData?.[key];
            const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
            return { key, oldVal, newVal, changed };
        })
        .filter(c => c.changed || (!oldData || !newData));

    if (changes.length === 0) {
        return <span className="audit-diff-empty">Tidak ada perubahan terdeteksi</span>;
    }

    return (
        <div className="audit-diff-table">
            <div className="audit-diff-header">
                <span>Field</span>
                {oldData && <span>Sebelum</span>}
                {newData && <span>Sesudah</span>}
            </div>
            {changes.map(({ key, oldVal, newVal, changed }) => (
                <div key={key} className={`audit-diff-row ${changed ? 'changed' : ''}`}>
                    <span className="audit-diff-key">{key}</span>
                    {oldData && (
                        <span className={`audit-diff-val ${changed ? 'audit-diff-old' : ''}`}>
                            {oldVal !== null && oldVal !== undefined ? String(oldVal) : '-'}
                        </span>
                    )}
                    {newData && (
                        <span className={`audit-diff-val ${changed ? 'audit-diff-new' : ''}`}>
                            {newVal !== null && newVal !== undefined ? String(newVal) : '-'}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function AuditLogs() {
    const { isAdmin, roleLoading } = useRole();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTable, setFilterTable] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async () => {
        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (filterTable) query = query.eq('table_name', filterTable);
            if (filterAction) query = query.eq('action', filterAction);

            const { data, error } = await query;
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchLogs();
    }, [isAdmin, filterTable, filterAction]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchLogs();
    };

    const filtered = useMemo(() => {
        if (!search) return logs;
        const q = search.toLowerCase();
        return logs.filter(log =>
            (log.changed_by_email || '').toLowerCase().includes(q) ||
            (TABLE_LABELS[log.table_name] || log.table_name).toLowerCase().includes(q) ||
            JSON.stringify(log.new_data || log.old_data || '').toLowerCase().includes(q)
        );
    }, [logs, search]);

    if (roleLoading || loading) return <PageLoadingSkeleton type="table" />;

    if (!isAdmin) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '60px 20px', textAlign: 'center' }}
            >
                <ShieldAlert size={48} style={{ color: 'var(--danger-500)', marginBottom: 16 }} />
                <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Akses Ditolak</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Halaman Log Aktivitas hanya dapat diakses oleh Administrator.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        <Activity size={20} />
                    </div>
                    <div className="stat-label">Total Log</div>
                    <div className="stat-value">{logs.length}</div>
                </motion.div>
                {['INSERT', 'UPDATE', 'DELETE'].map((action, idx) => {
                    const config = ACTION_CONFIG[action];
                    const Icon = config.icon;
                    const count = logs.filter(l => l.action === action).length;
                    const colors = {
                        INSERT: { bg: 'rgba(16, 185, 129, 0.1)', fg: '#10b981' },
                        UPDATE: { bg: 'rgba(245, 158, 11, 0.1)', fg: '#f59e0b' },
                        DELETE: { bg: 'rgba(239, 68, 68, 0.1)', fg: '#ef4444' },
                    };
                    return (
                        <motion.div key={action} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                            <div className="stat-icon" style={{ background: colors[action].bg, color: colors[action].fg }}>
                                <Icon size={20} />
                            </div>
                            <div className="stat-label">{config.label}</div>
                            <div className="stat-value">{count}</div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-input-wrapper">
                        <Search />
                        <input
                            className="form-input search-input"
                            placeholder="Cari email, tabel, atau data..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ minWidth: '160px' }}
                        value={filterTable}
                        onChange={e => setFilterTable(e.target.value)}
                    >
                        <option value="">Semua Tabel</option>
                        {Object.entries(TABLE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        className="form-input form-select"
                        style={{ minWidth: '130px' }}
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                    >
                        <option value="">Semua Aksi</option>
                        <option value="INSERT">Tambah</option>
                        <option value="UPDATE">Ubah</option>
                        <option value="DELETE">Hapus</option>
                    </select>
                </div>
                <div className="page-toolbar-right">
                    <button
                        className="btn btn-outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {refreshing ? (
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Log List */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="audit-log-list">
                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={Activity}
                            title="Belum ada log aktivitas"
                            description="Log aktivitas akan muncul ketika ada perubahan data di sistem"
                        />
                    ) : (
                        filtered.map((log, idx) => {
                            const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                            const ActionIcon = actionCfg.icon;
                            const isExpanded = expandedId === log.id;
                            const tableLabel = TABLE_LABELS[log.table_name] || log.table_name;
                            const relative = formatRelative(log.created_at);

                            return (
                                <motion.div
                                    key={log.id}
                                    className={`audit-log-item ${isExpanded ? 'expanded' : ''}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                >
                                    <div
                                        className="audit-log-header"
                                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                    >
                                        <div className="audit-log-left">
                                            <div className={`audit-action-badge ${actionCfg.className}`}>
                                                <ActionIcon size={13} />
                                                <span>{actionCfg.label}</span>
                                            </div>
                                            <div className="audit-log-table-badge">
                                                <Database size={12} />
                                                <span>{tableLabel}</span>
                                            </div>
                                            {log.record_id && (
                                                <span className="audit-log-record-id">#{log.record_id}</span>
                                            )}
                                        </div>
                                        <div className="audit-log-right">
                                            <div className="audit-log-meta">
                                                <div className="audit-log-user">
                                                    <User size={12} />
                                                    <span>{log.changed_by_email || 'System'}</span>
                                                </div>
                                                <div className="audit-log-time">
                                                    <Clock size={12} />
                                                    <span>{formatDateTime(log.created_at)}</span>
                                                    {relative && (
                                                        <span className="audit-log-relative">({relative})</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="audit-log-expand">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                className="audit-log-detail"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <DiffViewer
                                                    oldData={log.old_data}
                                                    newData={log.new_data}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
