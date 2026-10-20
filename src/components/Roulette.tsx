import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';

const ITEM_HEIGHT = 112;
const SPIN_ITEMS = 42;

interface RouletteProps {
  participants: string[];
  winner: string | null;
  nonce: number | null;
  isSpinning: boolean;
  onComplete: () => void;
}

export function Roulette({ participants, winner, nonce, isSpinning, onComplete }: RouletteProps) {
  const strip = useMemo(() => {
    if (!winner || nonce === null) return [];
    const filler = Array.from({ length: SPIN_ITEMS - 1 }, () => {
      const index = Math.floor(Math.random() * participants.length);
      return participants[index] ?? winner;
    });
    return [...filler, winner];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, nonce]);

  const hasWinner = Boolean(winner) && !isSpinning;
  const targetY = -(strip.length - 1) * ITEM_HEIGHT;
  const winnerSize =
    winner && winner.length > 22
      ? 'text-lg sm:text-2xl'
      : winner && winner.length > 16
        ? 'text-xl sm:text-3xl'
        : 'text-3xl sm:text-4xl';

  return (
    <div className="relative">
      <div className="relative h-28 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-inner shadow-black/60">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-slate-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />

        {isSpinning && strip.length > 0 ? (
          <motion.div
            key={nonce}
            initial={{ y: 0 }}
            animate={{ y: targetY }}
            transition={{ duration: 4.2, ease: [0.15, 0.75, 0.14, 1] }}
            onAnimationComplete={onComplete}
            className="will-change-transform"
          >
            {strip.map((username, index) => (
              <div
                key={`${username}-${index}`}
                style={{ height: ITEM_HEIGHT }}
                className="flex items-center justify-center px-4"
              >
                <span className="max-w-full truncate bg-gradient-to-r from-amber-200 via-pink-300 to-fuchsia-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                  @{username}
                </span>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center px-4">
            {winner ? (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex min-w-0 items-center gap-3"
              >
                <Trophy className="h-7 w-7 shrink-0 text-amber-300" />
                <span
                  className={`min-w-0 break-all bg-gradient-to-r from-amber-200 via-pink-300 to-fuchsia-400 bg-clip-text text-center font-black leading-tight tracking-tight text-transparent ${winnerSize}`}
                >
                  @{winner}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Sparkles className="h-4 w-4" />
                Pulsa «Sortear ganador» para empezar
              </div>
            )}
          </div>
        )}
      </div>

      {hasWinner && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400"
        >
          Sorteo completado
        </motion.p>
      )}
    </div>
  );
}
