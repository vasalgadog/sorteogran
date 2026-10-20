import { useMemo, useState } from 'react';
import { Flame, History, Search, Trophy, Undo2, Users, X, Zap } from 'lucide-react';
import { bonusKeySet } from '../lib/bonus';
import type { WinnerRecord } from '../types';

type Tab = 'active' | 'burned' | 'history';

interface ParticipantsPanelProps {
  participants: string[];
  bonusUsers: string[];
  burned: string[];
  history: WinnerRecord[];
  currentWinner: string | null;
  disabled: boolean;
  onRemove: (username: string) => void;
  onRestore: (username: string) => void;
}

interface ParticipantGroup {
  username: string;
  entries: number;
}

const TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
});

function groupParticipants(participants: string[]): ParticipantGroup[] {
  const groups = new Map<string, ParticipantGroup>();

  for (const username of participants) {
    const key = username.toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.entries += 1;
    } else {
      groups.set(key, { username, entries: 1 });
    }
  }

  return [...groups.values()];
}

export function ParticipantsPanel({
  participants,
  bonusUsers,
  burned,
  history,
  currentWinner,
  disabled,
  onRemove,
  onRestore,
}: ParticipantsPanelProps) {
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');

  const bonusSet = useMemo(() => bonusKeySet(bonusUsers), [bonusUsers]);
  const activeGroups = useMemo(() => groupParticipants(participants), [participants]);

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return activeGroups;
    return activeGroups.filter((group) => group.username.toLowerCase().includes(term));
  }, [activeGroups, query]);

  const filteredBurned = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return burned;
    return burned.filter((username) => username.toLowerCase().includes(term));
  }, [burned, query]);

  const tabs: { id: Tab; label: string; count: number; icon: typeof Users }[] = [
    { id: 'active', label: 'Activos', count: activeGroups.length, icon: Users },
    { id: 'burned', label: 'Quemados', count: burned.length, icon: Flame },
    { id: 'history', label: 'Historial', count: history.length, icon: History },
  ];

  return (
    <aside className="flex h-full max-h-[640px] flex-col rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-white">Participaciones</h2>
          <p className="text-xs text-slate-500">
            {participants.length} en juego · {activeGroups.length} usuarios · {burned.length}{' '}
            quemados
          </p>
        </div>
        <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-bold text-fuchsia-300">
          {history.length} {history.length === 1 ? 'sorteo' : 'sorteos'}
        </span>
      </div>

      <div className="flex gap-1 px-3 pt-3">
        {tabs.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition ${
              tab === id
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className="text-[10px] text-slate-500">{count}</span>
          </button>
        ))}
      </div>

      {tab !== 'history' && (
        <div className="relative px-3 pt-3">
          <Search className="pointer-events-none absolute left-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar usuario..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-fuchsia-500/50"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'active' && (
          <ul className="space-y-1.5">
            {filteredGroups.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-slate-500">
                {query ? 'Sin resultados.' : 'No quedan participaciones activas.'}
              </li>
            )}
            {filteredGroups.map((group, index) => {
              const isWinner = currentWinner?.toLowerCase() === group.username.toLowerCase();
              const hasBonus = bonusSet.has(group.username.toLowerCase());

              return (
                <li
                  key={group.username}
                  className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 transition ${
                    isWinner
                      ? 'border-amber-400/40 bg-amber-400/10'
                      : 'border-transparent hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      @{group.username}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {group.entries > 1 && (
                        <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                          ×{group.entries}
                        </span>
                      )}
                      {hasBonus && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                          <Zap className="h-2.5 w-2.5" />
                          Bonus x2
                        </span>
                      )}
                    </div>
                  </div>
                  {isWinner && <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                  <button
                    type="button"
                    onClick={() => onRemove(group.username)}
                    disabled={disabled}
                    className="rounded-lg p-1 text-slate-600 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100 disabled:opacity-0"
                    aria-label={`Quemar a ${group.username}`}
                    title="Quemar usuario"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'burned' && (
          <ul className="space-y-1.5">
            {filteredBurned.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-slate-500">
                {query ? 'Sin resultados.' : 'Todavía no has quemado a nadie.'}
              </li>
            )}
            {filteredBurned.map((username) => (
              <li
                key={username}
                className="group flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 transition hover:border-white/10 hover:bg-white/5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-400 line-through">
                  @{username}
                </span>
                <button
                  type="button"
                  onClick={() => onRestore(username)}
                  disabled={disabled}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 opacity-0 transition hover:bg-emerald-500/10 hover:text-emerald-300 group-hover:opacity-100 disabled:opacity-0"
                >
                  <Undo2 className="h-3 w-3" />
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === 'history' && (
          <ul className="space-y-1.5">
            {history.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-slate-500">
                Aún no hay ganadores registrados.
              </li>
            )}
            {history.map((record, index) => (
              <li
                key={`${record.at}-${record.username}-${index}`}
                className="flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 transition hover:border-white/10 hover:bg-white/5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                  <Trophy className="h-3.5 w-3.5 text-amber-300" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  @{record.username}
                </span>
                <span className="text-[11px] tabular-nums text-slate-500">
                  {TIME_FORMATTER.format(record.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
