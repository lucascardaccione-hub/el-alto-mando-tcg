export type UserRole = 'admin' | 'seller' | 'user' | 'owner';

export interface RoleInfo {
  role: string;
  label: string;
  icon: string;
  color: string;
  badgeClass: string;
  description: string;
}

export function getRoleBadge(user?: { id?: number; username?: string; role?: string; email?: string } | null): RoleInfo {
  if (!user) {
    return {
      role: 'user',
      label: 'Jugador',
      icon: '🎮',
      color: 'emerald',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Jugador de la comunidad',
    };
  }

  const usernameLower = (user.username || '').toLowerCase();
  const isLuca = usernameLower === 'luca';

  if (isLuca) {
    return {
      role: 'admin',
      label: 'Admin Master',
      icon: '👑',
      color: 'amber',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40 font-bold',
      description: 'Administrador Maestro con control total',
    };
  }

  const role = (user.role || 'user').toLowerCase();

  if (role === 'admin' || role === 'owner') {
    return {
      role: 'admin',
      label: 'Administrador',
      icon: '🛡️',
      color: 'purple',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold',
      description: 'Administrador con acceso a gestión de stock y pedidos',
    };
  }

  if (role === 'seller' || role === 'vendedor') {
    return {
      role: 'seller',
      label: 'Vendedor',
      icon: '💼',
      color: 'blue',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold',
      description: 'Vendedor oficial con catálogo de cartas y gestión de pedidos',
    };
  }

  return {
    role: 'user',
    label: 'Jugador',
    icon: '🎮',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold',
    description: 'Entrenador y constructor de mazos',
  };
}

export function canAccessAdmin(user?: { username?: string; role?: string } | null): boolean {
  if (!user) return false;
  const usernameLower = (user.username || '').toLowerCase();
  if (usernameLower === 'luca') return true;
  const role = (user.role || '').toLowerCase();
  return role === 'admin' || role === 'owner' || role === 'seller' || role === 'vendedor';
}

export function isMasterAdmin(user?: { username?: string } | null): boolean {
  if (!user) return false;
  return (user.username || '').toLowerCase() === 'luca';
}
