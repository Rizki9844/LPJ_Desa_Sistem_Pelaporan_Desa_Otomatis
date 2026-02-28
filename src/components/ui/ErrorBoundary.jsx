import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — Global error catcher that prevents white screen crashes.
 * Uses React class component pattern (only way to catch render errors).
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '100vh', padding: '40px 20px', textAlign: 'center',
                    background: 'var(--bg-primary, #f8fafc)', color: 'var(--text-primary, #1e293b)',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
                        Terjadi Kesalahan
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '400px', lineHeight: 1.6, marginBottom: '24px' }}>
                        Aplikasi mengalami error yang tidak terduga. Silakan muat ulang halaman.
                    </p>
                    {this.state.error && (
                        <pre style={{
                            fontSize: '0.72rem', background: '#fef2f2', color: '#b91c1c',
                            padding: '12px 16px', borderRadius: '8px', maxWidth: '500px',
                            overflow: 'auto', marginBottom: '20px', textAlign: 'left',
                            border: '1px solid #fecaca',
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <button
                        onClick={this.handleReload}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 24px', borderRadius: '8px',
                            background: '#6366f1', color: 'white', border: 'none',
                            fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={16} /> Muat Ulang
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
