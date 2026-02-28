import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Building2, TrendingUp, TrendingDown,
    ClipboardList, BarChart3, FileText, PanelLeftClose,
    PanelLeftOpen, Activity, HardDrive,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useRole } from '../../hooks/useRole';

const navItems = [
    { label: 'MENU UTAMA', type: 'section' },
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/informasi-desa', icon: Building2, label: 'Informasi Desa' },
    { label: 'KEUANGAN', type: 'section' },
    { path: '/pendapatan', icon: TrendingUp, label: 'Pendapatan' },
    { path: '/belanja', icon: TrendingDown, label: 'Belanja' },
    { path: '/pembiayaan', icon: TrendingDown, label: 'Pembiayaan' },
    { path: '/realisasi', icon: BarChart3, label: 'Realisasi Anggaran' },
    { label: 'KEGIATAN', type: 'section' },
    { path: '/kegiatan', icon: ClipboardList, label: 'Kegiatan & Program' },
    { label: 'LAPORAN', type: 'section' },
    { path: '/generate-lpj', icon: FileText, label: 'Generate LPJ' },
    { label: 'ADMIN', type: 'section', adminOnly: true },
    { path: '/audit-logs', icon: Activity, label: 'Log Aktivitas', adminOnly: true },
    { path: '/backup', icon: HardDrive, label: 'Backup & Restore', adminOnly: true },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const location = useLocation();
    const { state } = useApp();
    const { isAdmin } = useRole();
    const namaDesa = state.villageInfo?.nama_desa;
    const sidebarTitle = namaDesa ? `Desa ${namaDesa}` : 'LPJ Desa';

    // Detect mobile to skip framer-motion width animation (conflicts with CSS translateX)
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' && window.innerWidth <= 768
    );
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <>
            <div
                className={`mobile-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />
            <motion.aside
                className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
                animate={isMobile ? undefined : { width: collapsed ? 80 : 280 }}
                style={isMobile ? { width: 280 } : undefined}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/logo-desa.png" alt="Logo Desa" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                className="sidebar-title"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2>{sidebarTitle}</h2>
                                <p>Sistem Pelaporan</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="sidebar-nav">
                    {navItems.filter(item => !item.adminOnly || isAdmin).map((item, idx) => {
                        if (item.type === 'section') {
                            return (
                                <div key={idx} className="nav-section-label">
                                    {!collapsed ? item.label : '•••'}
                                </div>
                            );
                        }
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <Icon />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-toggle">
                    <button onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        {!collapsed && <span>Tutup Sidebar</span>}
                    </button>
                </div>

                <div className="sidebar-branding">
                    {!collapsed ? (
                        <span>© 2026 by rizkimalikfajar</span>
                    ) : (
                        <span>rmf</span>
                    )}
                </div>
            </motion.aside>
        </>
    );
}
