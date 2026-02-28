import { motion } from 'framer-motion';

const shimmer = {
    initial: { opacity: 0.4 },
    animate: { opacity: 1 },
    transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
};

function SkeletonBlock({ width = '100%', height = '16px', borderRadius = '8px', style = {} }) {
    return (
        <motion.div
            className="skeleton-block"
            {...shimmer}
            style={{ width, height, borderRadius, ...style }}
        />
    );
}

// Skeleton for stat cards (Dashboard, summary strips)
export function StatCardSkeleton({ count = 4 }) {
    return (
        <div className="stats-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stat-card skeleton-card">
                    <SkeletonBlock width="40px" height="40px" borderRadius="12px" />
                    <SkeletonBlock width="60%" height="12px" style={{ marginTop: '12px' }} />
                    <SkeletonBlock width="80%" height="24px" style={{ marginTop: '8px' }} />
                </div>
            ))}
        </div>
    );
}

// Skeleton for table rows
export function TableRowSkeleton({ columns = 6, rows = 5 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="skeleton-row">
                    {Array.from({ length: columns }).map((_, c) => (
                        <td key={c}>
                            <SkeletonBlock
                                width={c === 0 ? '50px' : c === columns - 1 ? '60px' : `${60 + Math.random() * 30}%`}
                                height="14px"
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// Skeleton for card grids (Kegiatan bidang cards, sub-bidang cards)
export function CardGridSkeleton({ count = 5, columns = 3 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <SkeletonBlock width="44px" height="44px" borderRadius="12px" />
                        <div style={{ flex: 1 }}>
                            <SkeletonBlock width="70%" height="14px" />
                            <SkeletonBlock width="40%" height="10px" style={{ marginTop: '6px' }} />
                        </div>
                    </div>
                    <SkeletonBlock width="100%" height="6px" borderRadius="3px" style={{ marginTop: '12px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <SkeletonBlock width="30%" height="10px" />
                        <SkeletonBlock width="20%" height="10px" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Skeleton for the dashboard charts area
export function ChartSkeleton() {
    return (
        <div className="dashboard-grid">
            <div className="card skeleton-card" style={{ padding: '24px' }}>
                <SkeletonBlock width="140px" height="16px" style={{ marginBottom: '6px' }} />
                <SkeletonBlock width="200px" height="10px" style={{ marginBottom: '20px' }} />
                <SkeletonBlock width="100%" height="240px" borderRadius="12px" />
            </div>
            <div className="card skeleton-card" style={{ padding: '24px' }}>
                <SkeletonBlock width="120px" height="16px" style={{ marginBottom: '6px' }} />
                <SkeletonBlock width="160px" height="10px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
                    <SkeletonBlock width="180px" height="180px" borderRadius="50%" />
                </div>
            </div>
        </div>
    );
}

// Full page loading skeleton
export function PageLoadingSkeleton({ type = 'table' }) {
    if (type === 'dashboard') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <StatCardSkeleton />
                <ChartSkeleton />
            </motion.div>
        );
    }

    if (type === 'cards') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <SkeletonBlock key={i} width="25%" height="80px" borderRadius="var(--radius-lg)" />
                    ))}
                </div>
                <CardGridSkeleton />
            </motion.div>
        );
    }

    // Default: table skeleton
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary cards */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-card" style={{ flex: 1, padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                        <SkeletonBlock width="50%" height="28px" />
                        <SkeletonBlock width="70%" height="12px" style={{ marginTop: '8px' }} />
                    </div>
                ))}
            </div>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <SkeletonBlock width="200px" height="36px" borderRadius="var(--radius-md)" />
                <SkeletonBlock width="140px" height="36px" borderRadius="var(--radius-md)" />
            </div>
            {/* Table */}
            <div className="skeleton-card" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            {['20%', '25%', '15%', '15%', '15%', '10%'].map((w, i) => (
                                <th key={i}><SkeletonBlock width={w} height="12px" /></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <TableRowSkeleton />
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

export default SkeletonBlock;
