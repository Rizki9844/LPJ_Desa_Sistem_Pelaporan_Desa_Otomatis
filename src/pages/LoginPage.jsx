import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, KeyRound, ArrowRight, Loader2, Eye, EyeOff,
    Shield, Send, CheckCircle2, AlertCircle, Fingerprint, ShieldCheck, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Security: Rate limiting for brute force protection ──
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 180; // 3 minutes in seconds

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signInWithOtp, verifyOtp, isAuthenticated, loading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Security state
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockCountdown, setLockCountdown] = useState(0);

    // Animation state
    const [currentTime, setCurrentTime] = useState(new Date());
    const [logoLoaded, setLogoLoaded] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // OTP resend countdown
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // Lockout countdown
    useEffect(() => {
        if (lockCountdown <= 0) {
            if (isLocked) {
                setIsLocked(false);
                setAttempts(0);
            }
            return;
        }
        const timer = setTimeout(() => setLockCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [lockCountdown, isLocked]);

    // Security: Load attempts from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('loginAttempts');
        const storedLockUntil = sessionStorage.getItem('lockUntil');
        if (stored) setAttempts(parseInt(stored));
        if (storedLockUntil) {
            const remaining = Math.ceil((parseInt(storedLockUntil) - Date.now()) / 1000);
            if (remaining > 0) {
                setIsLocked(true);
                setLockCountdown(remaining);
            } else {
                sessionStorage.removeItem('lockUntil');
                sessionStorage.removeItem('loginAttempts');
            }
        }
    }, []);

    const recordFailedAttempt = useCallback(() => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        sessionStorage.setItem('loginAttempts', String(newAttempts));

        if (newAttempts >= MAX_ATTEMPTS) {
            setIsLocked(true);
            setLockCountdown(LOCKOUT_DURATION);
            const lockUntil = Date.now() + LOCKOUT_DURATION * 1000;
            sessionStorage.setItem('lockUntil', String(lockUntil));
            setError(`Terlalu banyak percobaan gagal. Akun dikunci selama ${Math.ceil(LOCKOUT_DURATION / 60)} menit.`);
        }
    }, [attempts]);

    const clearAttempts = () => {
        setAttempts(0);
        sessionStorage.removeItem('loginAttempts');
        sessionStorage.removeItem('lockUntil');
    };

    const clearMessages = () => { setError(''); setSuccess(''); };

    // ── Handle password login ──
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (isLocked) return;
        if (!email.trim() || !password.trim()) {
            setError('Email dan password harus diisi');
            return;
        }
        clearMessages();
        setLoading(true);
        try {
            await signIn(email.trim(), password);
            clearAttempts();
        } catch (err) {
            recordFailedAttempt();
            if (err.message?.includes('Invalid login')) {
                setError('Email atau password salah. Pastikan akun sudah terdaftar.');
            } else if (err.message?.includes('Email not confirmed')) {
                setError('Email belum dikonfirmasi. Periksa inbox email Anda.');
            } else {
                setError(err.message || 'Gagal login. Coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Handle OTP send ──
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (isLocked) return;
        if (!email.trim()) {
            setError('Masukkan alamat email Anda');
            return;
        }
        clearMessages();
        setLoading(true);
        try {
            await signInWithOtp(email.trim());
            setOtpSent(true);
            setCountdown(60);
            setSuccess('Kode OTP telah dikirim ke email Anda. Periksa inbox & folder spam.');
        } catch (err) {
            recordFailedAttempt();
            if (err.message?.includes('Signups not allowed')) {
                setError('Email tidak terdaftar. Hubungi administrator desa.');
            } else if (err.message?.includes('rate limit')) {
                setError('Terlalu banyak permintaan. Tunggu beberapa menit.');
            } else {
                setError(err.message || 'Gagal mengirim OTP. Coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Handle OTP verify ──
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (isLocked) return;
        if (!otpCode.trim() || otpCode.trim().length < 6) {
            setError('Masukkan 6 digit kode OTP');
            return;
        }
        clearMessages();
        setLoading(true);
        try {
            await verifyOtp(email.trim(), otpCode.trim());
            clearAttempts();
        } catch (err) {
            recordFailedAttempt();
            if (err.message?.includes('Token has expired')) {
                setError('Kode OTP kedaluwarsa. Kirim ulang kode baru.');
            } else if (err.message?.includes('invalid')) {
                setError('Kode OTP salah. Periksa dan coba lagi.');
            } else {
                setError(err.message || 'Kode OTP tidak valid.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = () => {
        setOtpCode('');
        setOtpSent(false);
        clearMessages();
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        clearMessages();
        setOtpSent(false);
        setOtpCode('');
        setPassword('');
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    };

    const formatLockTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    // ── Loading state ──
    if (authLoading) {
        return (
            <div className="login-page">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                >
                    <div className="login-loading-ring">
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#a5b4fc' }} />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
                        Memverifikasi sesi...
                    </span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="login-page">
            {/* Animated background orbs */}
            <div className="login-bg-particles">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`login-particle particle-${i + 1}`} />
                ))}
            </div>

            {/* Floating grid overlay */}
            <div className="login-grid-overlay" />

            {/* Main Card */}
            <motion.div
                className="login-container"
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* ── Logo & Branding ── */}
                <div className="login-header">
                    <motion.div
                        className="login-logo-area"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 14 }}
                    >
                        <div className="login-logo-glow" />
                        <img
                            src="/logo-kabupaten.png"
                            alt="Logo Kabupaten Tegal"
                            className="login-logo-img"
                            onLoad={() => setLogoLoaded(true)}
                            style={{ opacity: logoLoaded ? 1 : 0 }}
                        />
                        {!logoLoaded && (
                            <div className="login-logo-placeholder">
                                <Shield size={36} />
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <h1 className="login-title">Sistem Pelaporan</h1>
                        <p className="login-subtitle">Pemerintah Desa Begawat Kab. Tegal</p>
                    </motion.div>

                    {/* Live Clock */}
                    <motion.div
                        className="login-clock"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="login-clock-time">{formatTime(currentTime)}</div>
                        <div className="login-clock-date">{formatDate(currentTime)}</div>
                    </motion.div>
                </div>

                {/* ── Security Lock Banner ── */}
                <AnimatePresence>
                    {isLocked && (
                        <motion.div
                            className="login-lockout"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="login-lockout-icon">
                                <Shield size={20} />
                            </div>
                            <div>
                                <div className="login-lockout-title">Akses Dikunci Sementara</div>
                                <div className="login-lockout-desc">
                                    Terlalu banyak percobaan gagal. Coba lagi dalam{' '}
                                    <strong>{formatLockTime(lockCountdown)}</strong>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Tab Switcher ── */}
                <motion.div
                    className="login-tabs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <button
                        className={`login-tab ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => switchTab('password')}
                        disabled={loading || isLocked}
                    >
                        <Lock size={15} />
                        <span>Password</span>
                        {activeTab === 'password' && (
                            <motion.div className="login-tab-indicator" layoutId="tabIndicator" />
                        )}
                    </button>
                    <button
                        className={`login-tab ${activeTab === 'otp' ? 'active' : ''}`}
                        onClick={() => switchTab('otp')}
                        disabled={loading || isLocked}
                    >
                        <Fingerprint size={15} />
                        <span>Kode OTP</span>
                        {activeTab === 'otp' && (
                            <motion.div className="login-tab-indicator" layoutId="tabIndicator" />
                        )}
                    </button>
                </motion.div>

                {/* ── Error / Success Messages ── */}
                <AnimatePresence mode="wait">
                    {error && !isLocked && (
                        <motion.div
                            className="login-message login-error"
                            initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -10, scaleY: 0.8 }}
                            key="error"
                        >
                            <AlertCircle size={16} />
                            <div>
                                <span>{error}</span>
                                {attempts > 0 && attempts < MAX_ATTEMPTS && (
                                    <div className="login-attempts-warn">
                                        {MAX_ATTEMPTS - attempts} percobaan tersisa sebelum akun dikunci
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            className="login-message login-success"
                            initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -10, scaleY: 0.8 }}
                            key="success"
                        >
                            <CheckCircle2 size={16} />
                            <span>{success}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Forms ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'password' ? (
                        <motion.form
                            key="password-form"
                            className="login-form"
                            onSubmit={handlePasswordLogin}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="login-field">
                                <label className="login-label">
                                    <Mail size={14} />
                                    Alamat Email
                                </label>
                                <div className="login-input-wrapper">
                                    <input
                                        id="login-email"
                                        className="login-input"
                                        type="email"
                                        placeholder="admin@desa.go.id"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                                        autoComplete="email"
                                        autoFocus
                                        disabled={loading || isLocked}
                                    />
                                    <div className="login-input-line" />
                                </div>
                            </div>

                            <div className="login-field">
                                <label className="login-label">
                                    <Lock size={14} />
                                    Password
                                </label>
                                <div className="login-input-wrapper">
                                    <input
                                        id="login-password"
                                        className="login-input"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                                        autoComplete="current-password"
                                        disabled={loading || isLocked}
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <div className="login-input-line" />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                className="login-btn"
                                disabled={loading || isLocked || !email.trim() || !password.trim()}
                                whileHover={!loading && !isLocked ? { scale: 1.02 } : {}}
                                whileTap={!loading && !isLocked ? { scale: 0.98 } : {}}
                            >
                                {loading ? (
                                    <Loader2 size={18} className="login-spinner" />
                                ) : (
                                    <ArrowRight size={18} />
                                )}
                                <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                                <div className="login-btn-shine" />
                            </motion.button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="otp-form"
                            className="login-form"
                            onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {!otpSent ? (
                                <>
                                    <div className="login-field">
                                        <label className="login-label">
                                            <Mail size={14} />
                                            Alamat Email Terdaftar
                                        </label>
                                        <div className="login-input-wrapper">
                                            <input
                                                id="login-otp-email"
                                                className="login-input"
                                                type="email"
                                                placeholder="admin@desa.go.id"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                                                autoComplete="email"
                                                autoFocus
                                                disabled={loading || isLocked}
                                            />
                                            <div className="login-input-line" />
                                        </div>
                                    </div>

                                    <div className="login-otp-info-box">
                                        <Fingerprint size={18} />
                                        <p>Kode verifikasi 6 digit akan dikirim ke email yang terdaftar di sistem.</p>
                                    </div>

                                    <motion.button
                                        type="submit"
                                        className="login-btn login-btn-otp"
                                        disabled={loading || isLocked || !email.trim()}
                                        whileHover={!loading && !isLocked ? { scale: 1.02 } : {}}
                                        whileTap={!loading && !isLocked ? { scale: 0.98 } : {}}
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="login-spinner" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                        <span>{loading ? 'Mengirim...' : 'Kirim Kode OTP'}</span>
                                        <div className="login-btn-shine" />
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        className="login-otp-sent-badge"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                    >
                                        <CheckCircle2 size={18} />
                                        <span>Kode dikirim ke <strong>{email}</strong></span>
                                    </motion.div>

                                    <div className="login-field">
                                        <label className="login-label">
                                            <KeyRound size={14} />
                                            Masukkan Kode OTP
                                        </label>
                                        <div className="login-input-wrapper">
                                            <input
                                                id="login-otp-code"
                                                className="login-input login-input-otp"
                                                type="text"
                                                placeholder="• • • • • •"
                                                value={otpCode}
                                                onChange={(e) => {
                                                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setOtpCode(v);
                                                    clearMessages();
                                                }}
                                                autoComplete="one-time-code"
                                                autoFocus
                                                disabled={loading || isLocked}
                                                maxLength={6}
                                                inputMode="numeric"
                                            />
                                            <div className="login-input-line" />
                                        </div>
                                        {/* OTP digit visualizer */}
                                        <div className="login-otp-dots">
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className={`login-otp-dot ${i < otpCode.length ? 'filled' : ''}`}
                                                    animate={i < otpCode.length ? { scale: [1, 1.3, 1] } : {}}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <motion.button
                                        type="submit"
                                        className="login-btn"
                                        disabled={loading || isLocked || otpCode.length < 6}
                                        whileHover={!loading && !isLocked ? { scale: 1.02 } : {}}
                                        whileTap={!loading && !isLocked ? { scale: 0.98 } : {}}
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="login-spinner" />
                                        ) : (
                                            <ShieldCheck size={18} />
                                        )}
                                        <span>{loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}</span>
                                        <div className="login-btn-shine" />
                                    </motion.button>

                                    <div className="login-resend-row">
                                        {countdown > 0 ? (
                                            <span className="login-countdown">
                                                Kirim ulang dalam <strong>{countdown}s</strong>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="login-resend-btn"
                                                onClick={handleResendOtp}
                                                disabled={loading || isLocked}
                                            >
                                                ↻ Kirim ulang kode
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* ── Footer ── */}
                <motion.div
                    className="login-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="login-security-badges">
                        <div className="login-badge">
                            <ShieldCheck size={11} />
                            <span>Enkripsi SSL</span>
                        </div>
                        <div className="login-badge-dot" />
                        <div className="login-badge">
                            <Fingerprint size={11} />
                            <span>2FA Ready</span>
                        </div>
                        <div className="login-badge-dot" />
                        <div className="login-badge">
                            <Lock size={11} />
                            <span>Akses Terbatas</span>
                        </div>
                    </div>
                    <a
                        className="login-wa-help"
                        href="https://wa.me/628882848440?text=Halo%20Admin%2C%20saya%20butuh%20bantuan%20terkait%20Sistem%20LPJ%20Desa."
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle size={14} />
                        <span>Butuh Bantuan? Hubungi Tim Kami</span>
                    </a>
                    <div className="login-footer-copyright">
                        © {new Date().getFullYear()} by rizkimalikfajar — Sistem Pelaporan Desa Otomatis
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
