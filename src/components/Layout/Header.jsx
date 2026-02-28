import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, HelpCircle, LogOut, ChevronDown, AlertTriangle, MessageCircle, BookOpen, FileText, Settings, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import YearSwitcher from '../ui/YearSwitcher';
import NotificationBell from '../ui/NotificationBell';

const pageTitles = {
    '/': { title: 'Dashboard', breadcrumb: 'Beranda' },
    '/informasi-desa': { title: 'Informasi Desa', breadcrumb: 'Data Desa' },
    '/pendapatan': { title: 'Pendapatan Desa', breadcrumb: 'Keuangan' },
    '/belanja': { title: 'Belanja Desa', breadcrumb: 'Keuangan' },
    '/pembiayaan': { title: 'Pembiayaan Desa', breadcrumb: 'Keuangan' },
    '/kegiatan': { title: 'Kegiatan & Program', breadcrumb: 'Kegiatan' },
    '/realisasi': { title: 'Realisasi Anggaran', breadcrumb: 'Keuangan' },
    '/generate-lpj': { title: 'Generate LPJ', breadcrumb: 'Laporan' },
    '/audit-logs': { title: 'Log Aktivitas', breadcrumb: 'Admin' },
    '/backup': { title: 'Backup & Restore', breadcrumb: 'Admin' },
};

export default function Header({ collapsed, setMobileOpen }) {
    const { theme, toggleTheme, state } = useApp();
    const { user, signOut } = useAuth();
    const { roleLabel, roleBadgeClass } = useRole();
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showHelpPanel, setShowHelpPanel] = useState(false);
    const pageInfo = pageTitles[location.pathname] || { title: 'LPJ Desa', breadcrumb: '' };
    const namaDesa = state.villageInfo?.nama_desa;
    const desaLabel = namaDesa ? `Desa ${namaDesa}` : 'LPJ Desa';

    const handleLogoutClick = () => {
        setShowUserMenu(false);
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const userEmail = user?.email || 'Admin';
    const userInitial = userEmail.charAt(0).toUpperCase();

    return (
        <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <div>
                        <h1 className="header-title">{pageInfo.title}</h1>
                        <div className="header-breadcrumb">
                            {desaLabel} / <span>{pageInfo.breadcrumb}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="header-right">
                <YearSwitcher />
                <NotificationBell />
                <div style={{ position: 'relative' }}>
                    <button
                        className="header-btn"
                        onClick={() => setShowHelpPanel(!showHelpPanel)}
                        title="Bantuan"
                    >
                        <HelpCircle />
                    </button>

                    <AnimatePresence>
                        {showHelpPanel && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                    onClick={() => setShowHelpPanel(false)}
                                />
                                <motion.div
                                    className="help-panel"
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="help-panel-header">
                                        <BookOpen size={16} />
                                        <span>Pusat Bantuan</span>
                                    </div>

                                    <div className="help-panel-section">
                                        <div className="help-panel-label">Panduan Cepat</div>
                                        <div className="help-panel-guides">
                                            <div className="help-guide-item">
                                                <div className="help-guide-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}><FileText size={14} /></div>
                                                <div>
                                                    <div className="help-guide-title">Informasi Desa</div>
                                                    <div className="help-guide-desc">Edit profil desa & pejabat di menu Informasi Desa</div>
                                                </div>
                                            </div>
                                            <div className="help-guide-item">
                                                <div className="help-guide-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Settings size={14} /></div>
                                                <div>
                                                    <div className="help-guide-title">Data Keuangan</div>
                                                    <div className="help-guide-desc">Input pendapatan, belanja & pembiayaan desa</div>
                                                </div>
                                            </div>
                                            <div className="help-guide-item">
                                                <div className="help-guide-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><BookOpen size={14} /></div>
                                                <div>
                                                    <div className="help-guide-title">Generate LPJ</div>
                                                    <div className="help-guide-desc">Buat laporan LPJ otomatis di menu Generate LPJ</div>
                                                </div>
                                            </div>
                                            <div className="help-guide-item">
                                                <div className="help-guide-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Shield size={14} /></div>
                                                <div>
                                                    <div className="help-guide-title">Keamanan</div>
                                                    <div className="help-guide-desc">Jaga kerahasiaan akun, jangan bagikan password</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="help-panel-divider" />

                                    <div className="help-panel-section">
                                        <div className="help-panel-label">Butuh Bantuan Lebih?</div>
                                        <p className="help-panel-note">Saat ini layanan bantuan tersedia melalui WhatsApp. Tim kami siap membantu Anda.</p>
                                        <a
                                            className="help-wa-btn"
                                            href="https://wa.me/628882848440?text=Halo%20Admin%2C%20saya%20butuh%20bantuan%20terkait%20Sistem%20LPJ%20Desa."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setShowHelpPanel(false)}
                                        >
                                            <MessageCircle size={16} />
                                            <span>Chat via WhatsApp</span>
                                        </a>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <button className="header-btn theme-toggle" onClick={toggleTheme} title="Toggle tema">
                    <AnimatePresence mode="wait">
                        {theme === 'light' ? (
                            <motion.div
                                key="moon"
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex' }}
                            >
                                <Moon size={18} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sun"
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex' }}
                            >
                                <Sun size={18} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* User Menu with Dropdown */}
                <div style={{ position: 'relative' }}>
                    <div
                        className="header-user"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="header-user-avatar">
                            {userInitial}
                        </div>
                        <div className="header-user-info">
                            <div className="header-user-name">{userEmail.split('@')[0]}</div>
                            <div className="header-user-role">
                                <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>
                            </div>
                        </div>
                        <ChevronDown size={14} style={{
                            color: 'var(--text-tertiary)',
                            transition: 'transform 0.2s',
                            transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                        }} />
                    </div>

                    <AnimatePresence>
                        {showUserMenu && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <motion.div
                                    className="header-dropdown"
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="header-dropdown-info">
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {userEmail}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                            Sesi aktif
                                        </div>
                                    </div>
                                    <div className="header-dropdown-divider" />
                                    <button
                                        className="header-dropdown-item header-dropdown-logout"
                                        onClick={handleLogoutClick}
                                    >
                                        <LogOut size={15} />
                                        <span>Keluar</span>
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <>
                        <motion.div
                            className="logout-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                        />
                        <motion.div
                            className="logout-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div className="logout-modal-icon">
                                <AlertTriangle size={28} />
                            </div>
                            <h3 className="logout-modal-title">Konfirmasi Keluar</h3>
                            <p className="logout-modal-desc">Apakah Anda yakin ingin keluar dari sistem? Anda perlu login kembali untuk mengakses dashboard.</p>
                            <div className="logout-modal-actions">
                                <button
                                    className="logout-modal-btn logout-modal-cancel"
                                    onClick={() => setShowLogoutConfirm(false)}
                                >
                                    Batal
                                </button>
                                <button
                                    className="logout-modal-btn logout-modal-confirm"
                                    onClick={handleLogoutConfirm}
                                >
                                    <LogOut size={15} />
                                    Ya, Keluar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
