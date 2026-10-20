import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Copy, ExternalLink, Flame, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface WinnerCardProps {
  winner: string;
  remaining: number;
  onReroll: () => void;
  onBurn: () => void;
}

const CONFETTI_COLORS = ['#fbbf24', '#ec4899', '#a855f7', '#22d3ee', '#f472b6'];

function celebrate() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const base = { particleCount: 90, spread: 75, colors: CONFETTI_COLORS, zIndex: 60 };

  confetti({ ...base, origin: { x: 0.2, y: 0.7 }, angle: 60 });
  confetti({ ...base, origin: { x: 0.8, y: 0.7 }, angle: 120 });
  window.setTimeout(() => {
    confetti({ ...base, particleCount: 60, spread: 110, origin: { x: 0.5, y: 0.4 } });
  }, 250);
}

export function WinnerCard({ winner, remaining, onReroll, onBurn }: WinnerCardProps) {
  const [copied, setCopied] = useState(false);
  const initial = winner.charAt(0).toUpperCase();
  const nameSize = winner.length > 22 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl';

  useEffect(() => {
    celebrate();
  }, [winner]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`@${winner}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-purple-600/10 p-6 shadow-2xl shadow-fuchsia-950/40"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" />

      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
        <Trophy className="h-4 w-4" />
        Ganador/a del sorteo
      </div>

      <div className="mt-5 flex items-center gap-3 sm:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-pink-500 to-purple-600 text-2xl font-black text-white shadow-lg shadow-fuchsia-500/40 sm:h-16 sm:w-16">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`break-all font-black leading-tight tracking-tight text-white ${nameSize}`}>
            @{winner}
          </p>
          <a
            href={`https://instagram.com/${winner}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-fuchsia-300"
          >
            Ver perfil en Instagram
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-fuchsia-500/40 hover:text-white"
          aria-label="Copiar nombre de usuario"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onReroll}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-500/40 hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
          Volver a sortear
        </button>
        <button
          type="button"
          onClick={onBurn}
          disabled={remaining <= 1}
          title={remaining <= 1 ? 'No quedarían participantes' : undefined}
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:border-rose-500/60 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Flame className="h-4 w-4" />
          Quemar y sortear
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Quedan <span className="font-semibold text-slate-300">{remaining}</span> participaciones
        activas. «Quemar» elimina al ganador y lanza otro sorteo.
      </p>
    </motion.div>
  );
}
