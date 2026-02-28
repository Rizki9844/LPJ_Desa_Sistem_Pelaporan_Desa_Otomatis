import { Navigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { Loader2 } from 'lucide-react';

/**
 * Komponen wrapper yang melindungi route berdasarkan role.
 * 
 * @param {string[]} allowedRoles - Array role yang diizinkan (e.g. ['admin'])
 * @param {React.ReactNode} children - Komponen yang dilindungi
 * @param {string} fallback - redirect path jika tidak berhak (default: '/')
 */
export default function RoleGuard({ allowedRoles = [], children, fallback = '/' }) {
    const { role, roleLoading } = useRole();

    if (roleLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '16px',
            }}>
                <Loader2
                    size={32}
                    style={{
                        animation: 'spin 1s linear infinite',
                        color: 'var(--primary-500)',
                    }}
                />
                <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                }}>
                    Memverifikasi akses...
                </div>
            </div>
        );
    }

    if (!allowedRoles.includes(role)) {
        return <Navigate to={fallback} replace />;
    }

    return children;
}
