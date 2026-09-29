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
} from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  role: string;
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
  const [newRole, setNewRole] = useState('admin');
  const [creating, setCreating] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        fetchUsers();
      }
    } catch (e) {
      showNotification('error', 'Error de conexión');
    } finally {
      setCreating(false);
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
          <span>Gestión de Usuarios Autorizados</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Controla quiénes pueden iniciar sesión en el panel y subir o modificar cartas de stock.
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

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all flex items-center justify-center gap-2"
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
      <div className="bg-[#0d1629] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Usuarios con Permiso de Carga ({users.length})</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Cargando usuarios...</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {users.map((u) => (
              <div
                key={u.id}
                className="py-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      u.is_active === 1
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {u.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{u.username}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          u.username.toLowerCase() === 'luca'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-600/70 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {u.username.toLowerCase() === 'luca' ? '👑 Master / Administrador Principal' : 'Colaborador de Inventario'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Registrado: {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
