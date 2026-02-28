import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    // Auto-close mobile sidebar on resize past breakpoint & auto-collapse on tablet
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
            if (window.innerWidth <= 1024 && window.innerWidth > 768) setCollapsed(true);
        };
        handleResize(); // run on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Global keyboard shortcuts
    const shortcuts = useMemo(() => ({
        'ctrl+1': () => navigate('/'),
        'ctrl+2': () => navigate('/pendapatan'),
        'ctrl+3': () => navigate('/belanja'),
        'ctrl+4': () => navigate('/kegiatan'),
        'ctrl+5': () => navigate('/realisasi'),
        'ctrl+6': () => navigate('/generate-lpj'),
        'ctrl+7': () => navigate('/informasi-desa'),
        'ctrl+b': () => setCollapsed(c => !c),
    }), [navigate]);

    useKeyboardShortcuts(shortcuts);

    return (
        <div className="app-layout">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />
            <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <Header collapsed={collapsed} setMobileOpen={setMobileOpen} />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
