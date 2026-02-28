import { CheckCircle2, Clock, AlertCircle, Landmark, HardHat, Users, Rocket, ShieldAlert } from 'lucide-react';

export const iconMap = { Landmark, HardHat, Users, Rocket, ShieldAlert };

export const statusConfig = {
    selesai: { label: 'Selesai', badge: 'badge-success', icon: CheckCircle2 },
    berjalan: { label: 'Berjalan', badge: 'badge-warning', icon: Clock },
    direncanakan: { label: 'Direncanakan', badge: 'badge-info', icon: AlertCircle },
};

export const progressColor = (p) => {
    if (p >= 100) return 'green';
    if (p >= 50) return 'blue';
    if (p > 0) return 'amber';
    return 'red';
};
