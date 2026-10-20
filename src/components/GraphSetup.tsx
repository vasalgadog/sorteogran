import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Link2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useGraphAPI } from '../hooks/useGraphAPI';
import { appConfig } from '../lib/config';
import type { GraphExtractionResult, ParticipantSource } from '../types';
import { InstagramIcon } from './InstagramIcon';

interface GraphSetupProps {
  onLoaded: (result: GraphExtractionResult) => void;
  onDemo: () => void;
}

export function GraphSetup({ onLoaded, onDemo }: GraphSetupProps) {
  const graph = useGraphAPI();
  const [url, setUrl] = useState('');
  const [unique, setUnique] = useState(true);
  const [source, setSource] = useState<ParticipantSource>(appConfig.participantSource);
  const [touched, setTouched] = useState(false);

  const selectedPage = graph.selectedPage;
  const connected = graph.status === 'connected';
  const hasInstagram = Boolean(selectedPage?.instagram);
  const invalid = touched && url.trim().length === 0;
  const canSubmit = connected && hasInstagram && !graph.busy;
  const showLogin =
    graph.status === 'anonymous' ||
    (graph.status === 'error' && !connected) ||
    graph.status === 'initializing';

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      setUrl('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    if (!url.trim() || !canSubmit) return;

    try {
      const result = await graph.extract(url.trim(), unique, source);
      onLoaded(result);
    } catch {
      return;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <InstagramIcon className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {connected ? 'Cuenta conectada' : 'Conecta tu cuenta de Instagram'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {connected
                ? 'Elige la página, pega la publicación y cargamos todos los comentarios.'
                : 'Usamos Facebook Login y la Graph API oficial. Sin servidores intermedios.'}
            </p>
          </div>
        </div>

        {connected ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Conectado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Graph API
          </span>
        )}
      </div>

      {graph.status === 'config_missing' && (
        <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Falta el App ID de Meta</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                Crea <code className="rounded bg-black/30 px-1 py-0.5">frontend/.env</code> y
                define <code className="rounded bg-black/30 px-1 py-0.5">VITE_INSTAGRAM_APP_ID</code>.
                No hace falta ninguna clave secreta en el navegador.
              </p>
            </div>
          </div>
        </div>
      )}

      {graph.status === 'insecure' && (
        <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Facebook Login necesita HTTPS
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                Sirve la app con HTTPS para conectar la cuenta. En local puedes usar el modo demo
                o configurar un certificado TLS para Vite.
              </p>
            </div>
          </div>
        </div>
      )}

      {graph.status === 'initializing' && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-3.5 text-sm text-sky-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          {graph.stage || 'Conectando con Facebook...'}
        </div>
      )}

      {showLogin && graph.status !== 'initializing' && (
        <div className="mt-5 space-y-3">
          {graph.error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <p className="text-xs leading-relaxed text-rose-200">{graph.error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void graph.login()}
            disabled={graph.busy}
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {graph.busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {graph.stage || 'Conectando...'}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Conectar con Facebook
              </>
            )}
          </button>

          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              El token de acceso vive solo en esta pestaña. Necesitas administrar una página con
              una cuenta de Instagram profesional vinculada.
            </p>
          </div>

          <details className="group rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-semibold text-slate-400">
              Permisos que se solicitarán
              <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 break-words font-mono text-[10px] leading-relaxed text-slate-500">
              {appConfig.scopes.join(' · ')}
            </p>
          </details>
        </div>
      )}

      {connected && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="facebook-page"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Página de Facebook
                </label>
                {graph.pages.length > 1 ? (
                  <div className="relative">
                    <select
                      id="facebook-page"
                      value={selectedPage?.id ?? ''}
                      onChange={(event) => graph.selectPage(event.target.value)}
                      disabled={graph.busy}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 pr-9 text-sm font-semibold text-white outline-none transition focus:border-fuchsia-500/50 disabled:opacity-60"
                    >
                      {graph.pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                          {page.instagram ? ` · @${page.instagram.username}` : ' · sin Instagram'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Users className="h-4 w-4 text-slate-500" />
                    {selectedPage?.name ?? 'No hay páginas disponibles'}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void graph.refreshPages()}
                  disabled={graph.busy}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-fuchsia-500/40 hover:text-white disabled:opacity-40"
                  title="Actualizar páginas"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => void graph.logout()}
                  disabled={graph.busy}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-40"
                  title="Cerrar sesión de Facebook"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>

            {selectedPage?.instagram ? (
              <p className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-3 text-xs text-slate-400">
                <InstagramIcon className="h-3.5 w-3.5 text-fuchsia-400" />
                Cuenta de Instagram:{' '}
                <strong className="font-semibold text-white">@{selectedPage.instagram.username}</strong>
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 border-t border-white/5 pt-3 text-xs leading-relaxed text-amber-200/80">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                {selectedPage
                  ? 'Esta página no tiene una cuenta de Instagram profesional vinculada. Elige otra página o vincúlala desde Meta Business Suite.'
                  : 'No encontramos páginas de Facebook que administres. Comprueba los permisos de la app y vuelve a actualizar.'}
              </p>
            )}
          </div>

          {graph.error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-rose-200">{graph.error}</p>
                <button
                  type="button"
                  onClick={() => void graph.login()}
                  className="mt-2 text-[11px] font-bold text-rose-300 underline decoration-rose-400/40 underline-offset-2 hover:text-rose-200"
                >
                  Reconectar con Facebook
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ig-url" className="mb-2 block text-sm font-semibold text-slate-200">
                Enlace de la publicación
              </label>

              <div className="group relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition group-focus-within:text-fuchsia-400" />
                <input
                  id="ig-url"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  disabled={graph.busy}
                  className={`w-full rounded-2xl border bg-slate-950/70 py-3.5 pl-12 pr-24 text-sm text-white placeholder:text-slate-500 outline-none transition focus:ring-2 focus:ring-fuchsia-500/40 disabled:opacity-60 ${
                    invalid ? 'border-rose-500/70' : 'border-white/10 focus:border-fuchsia-500/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => void handlePaste()}
                  disabled={graph.busy}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Pegar
                </button>
              </div>

              {invalid && (
                <p className="mt-1.5 text-xs font-medium text-rose-400">
                  Pega el enlace de la publicación.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Participantes
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-900 p-1">
                  {(
                    [
                      { id: 'authors', label: 'Autores' },
                      { id: 'mentions', label: 'Menciones' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSource(option.id)}
                      disabled={graph.busy}
                      className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                        source === option.id
                          ? 'bg-fuchsia-500/20 text-fuchsia-200'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  {source === 'authors'
                    ? 'Cuenta a quien escribió cada comentario.'
                    : 'Solo a los usuarios mencionados con @ en el texto.'}
                </p>
              </div>

              <label className="flex cursor-pointer select-none items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/40 px-3.5 py-3 transition hover:border-white/10">
                <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={unique}
                    onChange={(event) => setUnique(event.target.checked)}
                    disabled={graph.busy}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-slate-900 transition checked:border-fuchsia-500 checked:bg-fuchsia-500"
                  />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-200">
                    Una por persona
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
                    Elimina comentarios repetidos del mismo usuario.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={!canSubmit}
                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {graph.busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {graph.stage || 'Cargando...'}
                  </>
                ) : (
                  <>
                    <InstagramIcon className="h-4 w-4" />
                    Cargar participantes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDemo}
                disabled={graph.busy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-fuchsia-500/40 hover:bg-white/10 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                Probar demo
              </button>
            </div>

            {graph.busy && graph.stage && (
              <p className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] leading-relaxed text-sky-200">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                {graph.stage}
              </p>
            )}
          </form>
        </div>
      )}

      {!connected && graph.status === 'config_missing' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onDemo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-fuchsia-500/40 hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Probar demo
          </button>
        </div>
      )}

      {!connected && graph.status !== 'config_missing' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onDemo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-fuchsia-500/40 hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Probar demo sin conectar Instagram
          </button>
        </div>
      )}
    </motion.div>
  );
}
