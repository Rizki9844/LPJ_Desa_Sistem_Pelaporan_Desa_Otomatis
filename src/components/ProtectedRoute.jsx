import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
                gap: '16px',
            }}>
                <Loader2
                    size={40}
                    style={{
                        animation: 'spin 1s linear infinite',
                        color: 'var(--primary-500)',
                    }}
                />
                <div style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                }}>
                    Memverifikasi sesi...
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
