import { InstagramIcon } from './InstagramIcon';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
        <InstagramIcon className="h-6 w-6 text-white" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-lg font-black tracking-tight text-white">
            Sorteo<span className="text-fuchsia-400">Gram</span>
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Sorteos justos
          </p>
        </div>
      )}
    </div>
  );
}
