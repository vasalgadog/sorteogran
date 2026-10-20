import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Dices,
  Flame,
  Loader2,
  Lock,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { BonusPhase } from './components/BonusPhase';
import { GraphSetup } from './components/GraphSetup';
import { Logo } from './components/Logo';
import { ParticipantsPanel } from './components/ParticipantsPanel';
import { Roulette } from './components/Roulette';
import { Toast, type ToastData } from './components/Toast';
import { WinnerCard } from './components/WinnerCard';
import { useRaffle } from './hooks/useRaffle';
import { uniqueParticipants } from './lib/bonus';
import { DEMO_PARTICIPANTS } from './lib/demo';
import type { GraphExtractionResult } from './types';

type View = 'setup' | 'raffle';

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'Conexión oficial',
    text: 'Facebook Login autoriza la lectura directa de la Graph API, sin backend ni scraping.',
  },
  {
    icon: ShieldCheck,
    title: 'Sorteo verificable',
    text: 'La selección usa aleatoriedad criptográfica del navegador, sin sesgos ni orden fijo.',
  },
  {
    icon: Flame,
    title: 'Quema y repite',
    text: 'Elimina al ganador de la lista y lanza otro sorteo al instante con los que quedan.',
  },
];

export default function App() {
  const raffle = useRaffle();
  const { clearError: clearRaffleError } = raffle;
  const [view, setView] = useState<View>(raffle.participants.length > 0 ? 'raffle' : 'setup');
  const [toast, setToast] = useState<ToastData | null>(null);

  const activeToast: ToastData | null = raffle.error
    ? { type: 'error', message: raffle.error }
    : toast;

  const closeToast = useCallback(() => {
    setToast(null);
    clearRaffleError();
  }, [clearRaffleError]);

  function handleLoaded(result: GraphExtractionResult) {
    raffle.setRoster(result.participants, 'instagram', false);
    setView('raffle');
    setToast({
      type: 'success',
      message: `Se cargaron ${result.meta.comments} comentarios de ${result.meta.users} usuarios desde @${result.meta.instagramUsername}.`,
    });
  }

  function handleDemo() {
    raffle.setRoster([...DEMO_PARTICIPANTS], 'demo', false);
    setView('raffle');

    const users = uniqueParticipants(DEMO_PARTICIPANTS).length;
    setToast({
      type: 'info',
      message: `Modo demo activo con ${DEMO_PARTICIPANTS.length} participaciones de ${users} usuarios ficticios.`,
    });
  }

  function handleReset() {
    const confirmed = window.confirm(
      '¿Reiniciar el sorteo? Se borrarán participantes, bonus, quemados e historial.'
    );
    if (!confirmed) return;
    raffle.reset();
    setView('setup');
    setToast({ type: 'info', message: 'Sesión reiniciada.' });
  }

  const hasSession = raffle.participants.length > 0 || raffle.burned.length > 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-600/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          {view === 'raffle' && (
            <button
              type="button"
              onClick={() => setView('setup')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-fuchsia-500/40 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cambiar publicación</span>
              <span className="sm:hidden">Volver</span>
            </button>
          )}
          {hasSession && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300"
              aria-label="Reiniciar sesión"
              title="Reiniciar sesión"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {view === 'setup' ? (
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                <Sparkles className="h-3.5 w-3.5" />
                Sorteos transparentes para Instagram
              </span>

              <h1 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
                Elige al ganador{' '}
                <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-fuchsia-500 bg-clip-text text-transparent">
                  sin dramas
                </span>
                .
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
                Conecta tu cuenta, pega el enlace de la publicación y deja que la Graph API
                reúna a todos los que comentaron. El sorteo, con una ruleta que se merece el
                momento.
              </p>
            </motion.div>

            <div className="mt-9">
              <GraphSetup onLoaded={handleLoaded} onDemo={handleDemo} />
            </div>

            {hasSession && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm sm:flex-row"
              >
                <p className="text-emerald-200/80">
                  Tienes una sesión guardada con{' '}
                  <strong className="font-semibold text-emerald-200">
                    {raffle.participants.length}
                  </strong>{' '}
                  participaciones activas.
                </p>
                <button
                  type="button"
                  onClick={() => setView('raffle')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  Volver al sorteo
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20">
                    <Icon className="h-4.5 w-4.5 text-fuchsia-300" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-100/70">
                <strong className="font-semibold text-amber-200">Antes de conectar:</strong>{' '}
                necesitas administrar una página de Facebook con una cuenta de Instagram
                profesional vinculada y tener aprobados los permisos de la Graph API en tu app de
                Meta. También puedes probar toda la mecánica con el modo demo.
              </p>
            </div>
          </div>
        ) : !raffle.started ? (
          <BonusPhase
            participants={raffle.baseParticipants}
            bonusUsers={raffle.bonusUsers}
            onToggleBonus={raffle.toggleBonus}
            onClearBonus={raffle.clearBonus}
            onStart={raffle.startRaffle}
          />
        ) : (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Sorteo en curso
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-semibold">
                    <Sparkles className="h-3 w-3 text-fuchsia-400" />
                    {raffle.lastMeta?.source === 'demo' ? 'Datos demo' : 'Graph API'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-semibold">
                    {raffle.participants.length} participaciones
                  </span>
                  {raffle.bonusUsers.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-semibold text-amber-300">
                      <Zap className="h-3 w-3" />
                      {raffle.bonusUsers.length} con bonus x2
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300 sm:flex"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reiniciar sesión
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7 lg:self-start">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                        {raffle.isSpinning
                          ? 'Sorteando'
                          : raffle.currentWinner
                            ? 'Resultado'
                            : 'Listo para sortear'}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {raffle.isSpinning
                          ? 'La ruleta está eligiendo entre las participaciones activas...'
                          : 'Selección aleatoria entre las participaciones activas.'}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      {raffle.isSpinning ? (
                        <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
                      ) : (
                        <Dices className="h-5 w-5 text-fuchsia-400" />
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Roulette
                      participants={raffle.participants}
                      winner={raffle.spinRequest?.winner ?? raffle.currentWinner}
                      nonce={raffle.spinRequest?.nonce ?? null}
                      isSpinning={raffle.isSpinning}
                      onComplete={raffle.completeSpin}
                    />
                  </div>

                  <div className="mt-6">
                    {raffle.currentWinner ? (
                      <WinnerCard
                        winner={raffle.currentWinner}
                        remaining={raffle.participants.length}
                        onReroll={raffle.reroll}
                        onBurn={raffle.burnWinner}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={raffle.startRaffle}
                        disabled={raffle.isSpinning || raffle.participants.length === 0}
                        className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {raffle.isSpinning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sorteando...
                          </>
                        ) : (
                          <>
                            <Dices className="h-4 w-4 transition group-hover:rotate-12" />
                            Sortear ganador
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {raffle.participants.length === 0 && (
                    <p className="mt-4 text-center text-xs font-medium text-rose-300">
                      No quedan participaciones. Añade una publicación nueva o reinicia la sesión.
                    </p>
                  )}
                </div>
              </section>

              <ParticipantsPanel
                participants={raffle.participants}
                bonusUsers={raffle.bonusUsers}
                burned={raffle.burned}
                history={raffle.history}
                currentWinner={raffle.currentWinner}
                disabled={raffle.isSpinning}
                onRemove={raffle.removeParticipant}
                onRestore={raffle.restoreParticipant}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center text-[11px] text-slate-500 sm:flex-row sm:px-6 sm:text-left">
          <p>
            SorteoGram · Sorteos justos a partir de comentarios públicos de Instagram.
          </p>
          <p>Hecho con React, Facebook Login y Graph API.</p>
        </div>
      </footer>

      <AnimatePresence>
        {activeToast && <Toast toast={activeToast} onClose={closeToast} />}
      </AnimatePresence>
    </div>
  );
}
