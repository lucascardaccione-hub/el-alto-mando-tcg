'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Check,
  AlertCircle,
  Trash2,
  Lock,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { getDefaultAvatar } from '@/lib/avatars';
import { getRoleBadge } from '@/lib/roles';

interface AdminUser {
  id: number;
  username: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  is_active: number;
  created_at: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [canManageUsers, setCanManageUsers] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('seller');
  const [creating, setCreating] = useState(false);

  // Edit phone inline state
  const [editingPhoneId, setEditingPhoneId] = useState<number | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter: all | sellers | players
  const [roleFilter, setRoleFilter] = useState<'all' | 'sellers' | 'players'>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setCanManageUsers(data.canManageUsers ?? false);
      } else if (res.status === 403 || res.status === 401) {
        setCanManageUsers(false);
      }
    } catch (e) {
      console.error(e);
      setCanManageUsers(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          phone: newPhone,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification('error', data.error || 'Error al crear usuario');
      } else {
        showNotification('success', `Usuario "${newUsername}" habilitado como Administrador.`);
        setNewUsername('');
        setNewPassword('');
        setNewPhone('');
        fetchUsers();
      }
    } catch (e) {
      showNotification('error', 'Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  // Save phone number
  const handleSavePhone = async (userId: number) => {
    setSavingPhone(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, phone: editingPhoneValue }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, phone: editingPhoneValue } : u))
        );
        showNotification('success', 'Número de WhatsApp guardado correctamente.');
        setEditingPhoneId(null);
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'Error al guardar WhatsApp');
      }
    } catch {
      showNotification('error', 'Error de conexión al guardar WhatsApp');
    } finally {
      setSavingPhone(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.is_active === 1 ? 0 : 1;
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, is_active: nextStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
        );
        showNotification(
          'success',
          `Usuario "${user.username}" ${nextStatus === 1 ? 'habilitado' : 'deshabilitado'}.`
        );
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'No se pudo cambiar el estado.');
      }
    } catch (e) {
      showNotification('error', 'Error al actualizar usuario');
    }
  };

  // Change Role
  const handleRoleChange = async (userId: number, nextRole: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: nextRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
        );
        showNotification('success', 'Rol de usuario actualizado correctamente.');
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'Error al cambiar rol.');
      }
    } catch {
      showNotification('error', 'Error de conexión');
    }
  };

  // Delete User
  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`¿Estás seguro de revocar el acceso a "${user.username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showNotification('success', `Acceso revocado a "${user.username}".`);
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'No se pudo revocar el acceso.');
      }
    } catch (e) {
      showNotification('error', 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Verificando permisos y cargando usuarios...</p>
      </div>
    );
  }

  if (canManageUsers === false) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Acceso Exclusivo de Administrador Maestro</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Solamente el usuario <strong className="text-amber-400 font-bold">Luca</strong> tiene autorización para habilitar o revocar cuentas en el panel de administración.
          </p>
          <p className="text-xs text-slate-500">
            Tu cuenta tiene permisos de administración para cargar cartas, gestionar stock e inventario.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel de Control</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Users className="w-7 h-7 text-purple-400" />
          <span>Gestión de Usuarios y Vendedores</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Control exclusivo de Luca: define qué usuarios tienen permiso de vender cartas y administrar stock.
        </p>
      </div>

      {/* Luca Master Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-blue-950/40 to-slate-900 border border-amber-500/40 text-xs text-slate-300 space-y-1.5 shadow-lg">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <span className="text-sm">👑</span>
          <span className="uppercase tracking-wider text-[11px]">Control Maestro de Roles (Exclusivo Luca)</span>
        </div>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          <strong className="text-white">Importante:</strong> Los usuarios con rol <strong className="text-emerald-400">Jugador</strong> NO pueden cargar cartas ni vender en la plataforma. Solamente los usuarios con rol <strong className="text-blue-400">Vendedor</strong> o <strong className="text-purple-400">Administrador</strong> tienen habilitada la carga al catálogo y la gestión de inventario. Como Admin Master, solamente tú puedes asignar o modificar el rol de vendedor.
        </p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs sm:text-sm animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-700 text-emerald-300'
              : 'bg-rose-950/90 border border-rose-800 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Add New Authorized User Box */}
      <div className="bg-[#0d1629] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-400" />
          <span>Habilitar Nuevo Usuario para el Panel</span>
        </h2>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Ej: lucas_tcg"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              WhatsApp (cód. país + núm)
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Ej: 5491123456789"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Rol Asignado
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="seller">💼 Vendedor</option>
              <option value="admin">🛡️ Administrador</option>
              <option value="user">🎮 Jugador</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Habilitando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Habilitar Usuario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      {(() => {
        const isSellerOrAdmin = (u: AdminUser) =>
          u.username.toLowerCase() === 'luca' ||
          u.role === 'admin' ||
          u.role === 'owner' ||
          u.role === 'seller' ||
          u.role === 'vendedor';

        const sellersCount = users.filter(isSellerOrAdmin).length;
        const playersCount = users.filter((u) => !isSellerOrAdmin(u)).length;

        const filteredUsers = users.filter((u) => {
          if (roleFilter === 'sellers') return isSellerOrAdmin(u);
          if (roleFilter === 'players') return !isSellerOrAdmin(u);
          return true;
        });

        return (
          <div className="bg-[#0d1629] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Directorio de Usuarios ({users.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Solo los <strong className="text-blue-300">Vendedores</strong> y <strong className="text-purple-300">Admins</strong> pueden cargar cartas y stock. Los <strong className="text-emerald-300">Jugadores</strong> no tienen permisos de venta.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('sellers')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === 'sellers'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>💼 Vendedores y Admins</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-950 text-blue-200">
                    {sellersCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('players')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === 'players'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>🎮 Jugadores (Sin venta)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                    {playersCount}
                  </span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Cargando usuarios...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No hay usuarios en esta categoría.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredUsers.map((u) => {
                  const canSell = isSellerOrAdmin(u);
                  return (
                    <div
                      key={u.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center p-0.5 flex-shrink-0 ${
                            u.is_active === 1
                              ? 'bg-slate-900 border-2 border-blue-500/50 shadow-md'
                              : 'bg-slate-900 border-2 border-slate-700 opacity-60'
                          }`}
                        >
                          <img
                            src={u.avatar_url || getDefaultAvatar(u.username)}
                            alt={u.username}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getDefaultAvatar(u.username);
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/perfil/${u.id}`}
                              target="_blank"
                              className="font-bold text-white text-sm hover:text-blue-400 hover:underline transition-colors flex items-center gap-1"
                              title="Ver perfil de usuario"
                            >
                              <span>{u.username}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </Link>

                            {u.username.toLowerCase() === 'luca' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-950/80 text-amber-300 border-amber-600/70 shadow-sm">
                                👑 Admin Master
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={u.role || 'user'}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-900 text-slate-200 border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                                  title="Cambiar rol del usuario (Solo Luca)"
                                >
                                  <option value="seller">💼 Vendedor</option>
                                  <option value="admin">🛡️ Administrador</option>
                                  <option value="user">🎮 Jugador</option>
                                </select>

                                {canSell ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-700/50">
                                    ✓ Permiso de Venta
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    ❌ Sin Permiso de Venta
                                  </span>
                                )}
                              </div>
                            )}

                            {!canSell && u.username.toLowerCase() !== 'luca' && (
                              <button
                                type="button"
                                onClick={() => handleRoleChange(u.id, 'seller')}
                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm cursor-pointer ml-1"
                                title="Asignar rol de Vendedor a este usuario"
                              >
                                + Promover a Vendedor
                              </button>
                            )}
                          </div>

                    {/* WhatsApp Status & Inline editor */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {editingPhoneId === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingPhoneValue}
                            onChange={(e) => setEditingPhoneValue(e.target.value)}
                            placeholder="54911XXXXXXXX"
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-blue-500 text-xs text-white focus:outline-none w-36"
                          />
                          <button
                            onClick={() => handleSavePhone(u.id)}
                            disabled={savingPhone}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingPhoneId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-[11px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPhoneId(u.id);
                              setEditingPhoneValue(u.phone || '');
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                              u.phone
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:border-emerald-500'
                                : 'bg-slate-900 text-amber-400 border-amber-700/50 hover:border-amber-500'
                            }`}
                            title="Toca para editar el número de WhatsApp de pedidos"
                          >
                            <span>💬 WhatsApp:</span>
                            <span className="font-mono">{u.phone ? `+${u.phone}` : 'Sin configurar (Toca para agregar)'}</span>
                            <span className="text-[10px] text-slate-400 ml-1 underline">Editar</span>
                          </button>
                        </div>
                      )}

                      <span className="text-[11px] text-slate-500">
                        · Registrado: {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {u.username.toLowerCase() === 'luca' ? (
                    <span className="text-[11px] text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
                      Cuenta Principal Activa
                    </span>
                  ) : (
                    <>
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          u.is_active === 1
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-700/60'
                            : 'bg-rose-950/80 text-rose-300 border-rose-800/60 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-700/60'
                        }`}
                      >
                        {u.is_active === 1 ? 'Activo (Habilitado)' : 'Inactivo (Bloqueado)'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Revocar acceso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          )}
        </div>
      );
    })()}
  </div>
);
}
