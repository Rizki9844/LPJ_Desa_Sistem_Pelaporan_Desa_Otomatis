import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { PageLoadingSkeleton } from './components/ui/Skeleton';

// Lazy-loaded pages (reduces initial bundle ~40%)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InformasiDesa = lazy(() => import('./pages/InformasiDesa'));
const Pendapatan = lazy(() => import('./pages/Pendapatan'));
const Belanja = lazy(() => import('./pages/Belanja'));
const Pembiayaan = lazy(() => import('./pages/Pembiayaan'));
const Kegiatan = lazy(() => import('./pages/Kegiatan'));
const RealisasiAnggaran = lazy(() => import('./pages/RealisasiAnggaran'));
const GenerateLPJ = lazy(() => import('./pages/GenerateLPJ'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const BackupRestore = lazy(() => import('./pages/BackupRestore'));
import RoleGuard from './components/ui/RoleGuard';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <Suspense fallback={<PageLoadingSkeleton type="cards" />}>
                                <Routes>
                                    {/* Public route */}
                                    <Route path="/login" element={<LoginPage />} />

                                    {/* Protected routes */}
                                    <Route element={
                                        <ProtectedRoute>
                                            <Layout />
                                        </ProtectedRoute>
                                    }>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/informasi-desa" element={<InformasiDesa />} />
                                        <Route path="/pendapatan" element={<Pendapatan />} />
                                        <Route path="/belanja" element={<Belanja />} />
                                        <Route path="/pembiayaan" element={<Pembiayaan />} />
                                        <Route path="/kegiatan" element={<Kegiatan />} />
                                        <Route path="/realisasi" element={<RealisasiAnggaran />} />
                                        <Route path="/generate-lpj" element={<GenerateLPJ />} />
                                        <Route path="/audit-logs" element={
                                            <RoleGuard allowedRoles={['admin']}>
                                                <AuditLogs />
                                            </RoleGuard>
                                        } />
                                        <Route path="/backup" element={
                                            <RoleGuard allowedRoles={['admin']}>
                                                <BackupRestore />
                                            </RoleGuard>
                                        } />
                                    </Route>

                                    {/* Catch-all */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </ToastProvider>
                </AppProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
