import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook untuk mengambil role user saat ini dari tabel user_roles.
 * Default: 'operator' jika belum ada entry di tabel.
 * 
 * Roles:
 * - 'admin'       → Akses penuh (CRUD + Audit Logs + Manage Users)
 * - 'operator'    → CRUD data desa (pegawai desa / bendahara)
 * - 'kepala_desa' → Read-only (hanya melihat data & laporan)
 */
export function useRole() {
    const { user, isAuthenticated } = useAuth();
    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    const fetchRole = useCallback(async () => {
        if (!user?.id) {
            setRole(null);
            setRoleLoading(false);
            return;
        }

        try {
            // Menggunakan RPC get_my_role() yang SECURITY DEFINER (bypass RLS)
            const { data, error } = await supabase.rpc('get_my_role');

            if (error) {
                console.error('Error fetching role:', error);
                setRole('operator');
            } else {
                setRole(data || 'operator');
            }
        } catch (err) {
            console.error('Role fetch failed:', err);
            setRole('operator');
        } finally {
            setRoleLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRole();
        } else {
            setRole(null);
            setRoleLoading(false);
        }
    }, [isAuthenticated, fetchRole]);

    // Permission helpers
    const isAdmin = role === 'admin';
    const isOperator = role === 'operator';
    const isKepalaDesa = role === 'kepala_desa';
    const canWrite = isAdmin || isOperator;
    const canManageUsers = isAdmin;
    const canViewAuditLogs = isAdmin;

    // Role display label
    const roleLabel = {
        admin: 'Administrator',
        operator: 'Operator Desa',
        kepala_desa: 'Kepala Desa',
    }[role] || 'Operator Desa';

    // Role badge color class
    const roleBadgeClass = {
        admin: 'role-badge-admin',
        operator: 'role-badge-operator',
        kepala_desa: 'role-badge-kades',
    }[role] || 'role-badge-operator';

    return {
        role,
        roleLoading,
        isAdmin,
        isOperator,
        isKepalaDesa,
        canWrite,
        canManageUsers,
        canViewAuditLogs,
        roleLabel,
        roleBadgeClass,
        refetchRole: fetchRole,
    };
}
