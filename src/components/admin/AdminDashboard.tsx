import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToAllUsers,
  updateUserApprovalStatus,
  fetchPlatformStats,
} from '../../services/adminService';
import { UserProfile, UserStatus, PlatformStats } from '../../types';
import {
  Shield,
  Users,
  Clock,
  CheckCircle2,
  Ban,
  RefreshCw,
  Search,
  Layers,
  QrCode,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isInitialAdminEmail, bootstrapAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    blockedUsers: 0,
    totalBatches: 0,
    totalPlaques: 0,
    totalRedirects: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Real-time listener for users
  useEffect(() => {
    setLoading(true);
    setQueryError(null);
    const unsubscribe = subscribeToAllUsers(
      (userList) => {
        setUsers(userList);
        setLoading(false);
        setQueryError(null);

        // Update counts from snapshot
        let pend = 0;
        let appr = 0;
        let blck = 0;
        userList.forEach((u) => {
          if (u.status === 'pending') pend++;
          else if (u.status === 'approved') appr++;
          else if (u.status === 'blocked') blck++;
        });

        setStats((prev) => ({
          ...prev,
          totalUsers: userList.length,
          pendingUsers: pend,
          approvedUsers: appr,
          blockedUsers: blck,
        }));
      },
      (err) => {
        console.error('Failed to subscribe to users:', err);
        const msg = err.message || 'Falha de permissão no Firestore.';
        setQueryError(msg);
        setFeedback({
          type: 'error',
          message: `Erro ao consultar compradores: ${msg}`,
        });
        setLoading(false);
      }
    );

    // Initial platform totals
    fetchPlatformStats().then((res) => {
      setStats((prev) => ({
        ...prev,
        ...res,
      }));
    });

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetchPlatformStats();
      setStats((prev) => ({ ...prev, ...res }));
      setFeedback({ type: 'success', message: 'Sincronização com o banco executada com sucesso!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao sincronizar: ${err.message}` });
    } finally {
      setSyncing(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleUpdateStatus = async (target: UserProfile, newStatus: UserStatus) => {
    if (!user || !user.email) return;
    setActionLoadingId(target.uid);
    setFeedback(null);
    try {
      await updateUserApprovalStatus(
        user.uid,
        user.email,
        target.uid,
        target.email,
        newStatus
      );
      const actionName =
        newStatus === 'approved'
          ? 'aprovado com sucesso'
          : newStatus === 'blocked'
          ? 'bloqueado'
          : 'marcado como pendente';
      setFeedback({
        type: 'success',
        message: `Comprador ${target.email} foi ${actionName}!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Falha ao alterar status de ${target.email}: ${err.message}`,
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      await bootstrapAdmin();
      setFeedback({
        type: 'success',
        message: 'Autoridade administrativa provisionada e gravada com sucesso em /admins!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro no bootstrap: ${err.message}` });
    } finally {
      setBootstrapping(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-600/50 text-red-500 shadow-md shadow-red-950/50">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              PAINEL ADMINISTRATIVO — <span className="text-red-500">DINÂMICO PRO</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão restrita de compradores, aprovação de licenças e métricas operacionais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'SINCRONIZAR'}</span>
          </button>
        </div>
      </div>

      {/* Admin Diagnostic / Bootstrap banner if relevant */}
      {isInitialAdminEmail && (
        <div className="mb-8 p-4 rounded-xl bg-zinc-900/80 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Conta Administradora Oficial Autenticada
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Identidade: <code className="text-red-400 font-mono font-bold">{user?.email}</code>. Permissões de super-administrador ativas.
              </p>
            </div>
          </div>
          <button
            onClick={handleBootstrap}
            disabled={bootstrapping}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-600 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {bootstrapping ? 'Gravando...' : 'Revalidar Credencial /admins'}
          </button>
        </div>
      )}

      {/* Real Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
        <div className="card-relief rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-zinc-400">Total Cadastros</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {stats.totalUsers}
          </div>
        </div>

        <div className="card-relief rounded-xl p-4 border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-amber-300">Aguardando</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">
            {stats.pendingUsers}
          </div>
        </div>

        <div className="card-relief rounded-xl p-4 border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-emerald-300">Aprovados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {stats.approvedUsers}
          </div>
        </div>

        <div className="card-relief rounded-xl p-4 border border-red-500/20 bg-red-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-red-300">Bloqueados</span>
            <Ban className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono tabular-nums">
            {stats.blockedUsers}
          </div>
        </div>

        <div className="card-relief rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-zinc-400">Plaquinhas</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {stats.totalPlaques}
          </div>
        </div>

        <div className="card-relief rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-zinc-400">QR Codes</span>
            <QrCode className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {stats.totalRedirects}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
              : 'bg-red-950/50 text-red-300 border-red-600/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Management Section */}
      <div className="card-relief rounded-2xl p-6 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Gerenciamento de Compradores
            </h2>
            <p className="text-xs text-zinc-400">
              Aprovação manual individual de acesso ao editor DINÂMICO PRO
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-950/60 text-amber-300 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pendentes ({stats.pendingUsers})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-950/60 text-emerald-300 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Aprovados ({stats.approvedUsers})
              </button>
              <button
                onClick={() => setStatusFilter('blocked')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'blocked'
                    ? 'bg-red-950/60 text-red-300 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bloqueados ({stats.blockedUsers})
              </button>
            </div>
          </div>
        </div>

        {/* Buyers Table */}
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
            <span>Consultando registros reais do Firestore...</span>
          </div>
        ) : queryError ? (
          <div className="py-12 px-4 text-center text-xs">
            <div className="max-w-md mx-auto p-4 rounded-xl bg-red-950/40 border border-red-600/50 text-red-300">
              <p className="font-bold text-white mb-1">Falha na consulta ao Firestore</p>
              <p className="text-[11px] text-zinc-400 mb-3">{queryError}</p>
              <button
                onClick={handleSync}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            <p>Nenhum comprador encontrado para o filtro selecionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Comprador</th>
                  <th className="py-3 px-4 font-semibold">E-mail</th>
                  <th className="py-3 px-4 font-semibold">Data Cadastro</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((item) => {
                  const isActing = actionLoadingId === item.uid;
                  return (
                    <tr key={item.uid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-zinc-300">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px]">
                        {item.email}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px] tabular-nums">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Aprovado
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pendente
                          </span>
                        )}
                        {item.status === 'blocked' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 text-red-400 border border-red-500/30 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(item, 'approved')}
                              disabled={isActing}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isActing ? '...' : 'Aprovar'}
                            </button>
                          )}

                          {item.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(item, 'blocked')}
                              disabled={isActing}
                              className="px-3 py-1 bg-zinc-800 hover:bg-red-950 hover:text-red-300 hover:border-red-600/50 border border-white/10 text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isActing ? '...' : 'Bloquear'}
                            </button>
                          )}

                          {item.status === 'blocked' && (
                            <button
                              onClick={() => handleUpdateStatus(item, 'approved')}
                              disabled={isActing}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isActing ? '...' : 'Reativar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
