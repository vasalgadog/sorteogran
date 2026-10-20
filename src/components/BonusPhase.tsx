import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Gift, RotateCcw, Search, Ticket, Users, Zap } from 'lucide-react';
import {
  bonusKeySet,
  countEntries,
  countFinalPool,
  uniqueParticipants,
} from '../lib/bonus';

interface BonusPhaseProps {
  participants: string[];
  bonusUsers: string[];
  onToggleBonus: (username: string) => void;
  onClearBonus: () => void;
  onStart: () => void;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof Users;
  accent?: boolean;
}

function StatCard({ label, value, icon: Icon, accent = false }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 ${
        accent
          ? 'border-amber-400/25 bg-amber-400/[0.06]'
          : 'border-white/5 bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] text-slate-500 sm:text-[11px] sm:tracking-[0.14em]">
          {label}
        </p>
        <Icon
          className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${
            accent ? 'text-amber-300' : 'text-fuchsia-300'
          }`}
        />
      </div>
      <p className="mt-2 text-xl font-black tabular-nums text-white sm:text-2xl">{value}</p>
    </div>
  );
}

export function BonusPhase({
  participants,
  bonusUsers,
  onToggleBonus,
  onClearBonus,
  onStart,
}: BonusPhaseProps) {
  const [query, setQuery] = useState('');

  const unique = useMemo(() => uniqueParticipants(participants), [participants]);
  const entryCounts = useMemo(() => countEntries(participants), [participants]);
  const bonusSet = useMemo(() => bonusKeySet(bonusUsers), [bonusUsers]);
  const finalPoolSize = useMemo(
    () => countFinalPool(participants, bonusUsers),
    [participants, bonusUsers]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return unique;
    return unique.filter((username) => username.toLowerCase().includes(term));
  }, [unique, query]);

  const totalBonusEntries = finalPoolSize - participants.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mx-auto max-w-4xl"
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
          <Gift className="h-3.5 w-3.5" />
          Fase de bonificación
        </span>

        <h1 className="mt-5 text-balance text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Reparte el{' '}
          <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-fuchsia-500 bg-clip-text text-transparent">
            Bonus x2
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-slate-400">
          Marca a quienes consiguieron el extra por historia o DM. Todas sus participaciones
          contarán el doble en la ruleta.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Usuarios únicos" value={unique.length} icon={Users} />
        <StatCard label="Con bonus x2" value={bonusUsers.length} icon={Zap} accent />
        <StatCard label="Participaciones finales" value={finalPoolSize} icon={Ticket} />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-white/5 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por @usuario..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
            />
          </div>

          <button
            type="button"
            onClick={onClearBonus}
            disabled={bonusUsers.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-fuchsia-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar bonus
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              {query ? 'No hay usuarios que coincidan con la búsqueda.' : 'No hay participantes.'}
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((username) => {
                const key = username.toLowerCase();
                const entries = entryCounts.get(key) ?? 1;
                const active = bonusSet.has(key);

                return (
                  <li
                    key={key}
                    className={`transition-colors ${
                      active ? 'bg-amber-400/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black sm:h-9 sm:w-9 ${
                          active
                            ? 'bg-gradient-to-br from-amber-300 via-pink-500 to-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {username.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">@{username}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {entries} {entries === 1 ? 'participación' : 'participaciones'}
                          {active && (
                            <>
                              {' · '}
                              <span className="font-semibold text-amber-300">
                                {entries * 2} con bonus
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] font-semibold leading-tight text-slate-300 sm:text-[11px]">
                            Bonus x2
                          </p>
                          <p className="text-[9px] leading-tight text-slate-500 sm:text-[10px]">
                            Historia/DM
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={active}
                          aria-label={`Aplicar bonus x2 a ${username}`}
                          onClick={() => onToggleBonus(username)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                            active
                              ? 'bg-gradient-to-r from-amber-400 to-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.45)]'
                              : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">
              El sorteo usará{' '}
              <strong className="font-bold text-white">{finalPoolSize} participaciones</strong> de{' '}
              {unique.length} usuarios.
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {totalBonusEntries > 0
                ? `El bonus añade ${totalBonusEntries} participaciones extra.`
                : 'Nadie tiene bonus todavía: todos juegan con sus participaciones base.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onStart}
            disabled={finalPoolSize === 0}
            className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Dices className="h-4 w-4 transition group-hover:rotate-12" />
            Iniciar sorteo
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-500">
        El bonus solo puede configurarse antes de iniciar el sorteo. Después podrás volver a
        sortear o quemar al ganador.
      </p>
    </motion.div>
  );
}
