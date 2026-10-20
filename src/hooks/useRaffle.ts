import { useCallback, useEffect, useState } from 'react';
import { generateFinalPool } from '../lib/bonus';
import { secureRandomIndex } from '../lib/random';
import type { WinnerRecord } from '../types';

const STORAGE_KEY = 'sorteogram:session:v1';

interface SessionSnapshot {
  participants: string[];
  baseParticipants: string[];
  bonusUsers: string[];
  started: boolean;
  burned: string[];
  history: WinnerRecord[];
  currentWinner: string | null;
}

interface SpinRequest {
  winner: string;
  nonce: number;
}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function loadSession(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    if (!Array.isArray(parsed.participants)) return null;

    const participants = asStringArray(parsed.participants);
    const baseParticipants = Array.isArray(parsed.baseParticipants)
      ? asStringArray(parsed.baseParticipants)
      : [...participants];

    return {
      participants,
      baseParticipants,
      bonusUsers: asStringArray(parsed.bonusUsers),
      started: typeof parsed.started === 'boolean' ? parsed.started : participants.length > 0,
      burned: asStringArray(parsed.burned),
      history: Array.isArray(parsed.history)
        ? parsed.history.filter(
            (item): item is WinnerRecord =>
              Boolean(item) && typeof item.username === 'string' && typeof item.at === 'number'
          )
        : [],
      currentWinner: typeof parsed.currentWinner === 'string' ? parsed.currentWinner : null,
    };
  } catch {
    return null;
  }
}

export function useRaffle() {
  const [initial] = useState<SessionSnapshot | null>(loadSession);

  const [participants, setParticipants] = useState<string[]>(initial?.participants ?? []);
  const [baseParticipants, setBaseParticipants] = useState<string[]>(
    initial?.baseParticipants ?? []
  );
  const [bonusUsers, setBonusUsers] = useState<string[]>(initial?.bonusUsers ?? []);
  const [started, setStarted] = useState<boolean>(initial?.started ?? false);
  const [burned, setBurned] = useState<string[]>(initial?.burned ?? []);
  const [history, setHistory] = useState<WinnerRecord[]>(initial?.history ?? []);
  const [currentWinner, setCurrentWinner] = useState<string | null>(initial?.currentWinner ?? null);
  const [spinRequest, setSpinRequest] = useState<SpinRequest | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{ source: 'instagram' | 'demo'; cached: boolean } | null>(
    null
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          participants,
          baseParticipants,
          bonusUsers,
          started,
          burned,
          history,
          currentWinner,
        })
      );
    } catch {
      // Sin persistencia disponible
    }
  }, [participants, baseParticipants, bonusUsers, started, burned, history, currentWinner]);

  const clearError = useCallback(() => setError(null), []);

  const setRoster = useCallback(
    (list: string[], source: 'instagram' | 'demo', cached: boolean) => {
      setParticipants(list);
      setBaseParticipants(list);
      setBonusUsers([]);
      setStarted(false);
      setBurned([]);
      setHistory([]);
      setCurrentWinner(null);
      setSpinRequest(null);
      setIsSpinning(false);
      setError(null);
      setLastMeta({ source, cached });
    },
    []
  );

  const toggleBonus = useCallback((username: string) => {
    const key = username.toLowerCase();
    setBonusUsers((previous) =>
      previous.some((item) => item.toLowerCase() === key)
        ? previous.filter((item) => item.toLowerCase() !== key)
        : [...previous, username]
    );
  }, []);

  const clearBonus = useCallback(() => setBonusUsers([]), []);

  const spin = useCallback((list: string[]) => {
    if (list.length === 0) {
      setError('No hay participaciones disponibles para sortear.');
      return;
    }

    const index = secureRandomIndex(list.length);
    const winner = list[index];

    setError(null);
    setCurrentWinner(null);
    setSpinRequest({ winner, nonce: Date.now() });
    setIsSpinning(true);
  }, []);

  const startRaffle = useCallback(() => {
    if (!started) {
      const base = baseParticipants.length > 0 ? baseParticipants : participants;

      if (base.length === 0) {
        setError('No hay participantes disponibles para sortear.');
        return;
      }

      const finalPool = generateFinalPool(base, bonusUsers);
      setParticipants(finalPool);
      setStarted(true);
      spin(finalPool);
      return;
    }

    spin(participants);
  }, [started, baseParticipants, participants, bonusUsers, spin]);

  const completeSpin = useCallback(() => {
    if (!spinRequest) return;

    const { winner } = spinRequest;
    setCurrentWinner(winner);
    setIsSpinning(false);
    setHistory((previous) => [{ username: winner, at: Date.now() }, ...previous]);
  }, [spinRequest]);

  const reroll = useCallback(() => {
    spin(participants);
  }, [participants, spin]);

  const burnWinner = useCallback(() => {
    if (!currentWinner) return;

    const target = currentWinner.toLowerCase();
    const remaining = participants.filter((participant) => participant.toLowerCase() !== target);

    setBurned((previous) => [...previous, currentWinner]);
    setParticipants(remaining);
    setCurrentWinner(null);
    setSpinRequest(null);

    if (remaining.length === 0) {
      setIsSpinning(false);
      setError('No quedan participaciones: todos los usuarios han sido quemados.');
      return;
    }

    spin(remaining);
  }, [currentWinner, participants, spin]);

  const removeParticipant = useCallback(
    (username: string) => {
      if (isSpinning) return;
      const target = username.toLowerCase();
      setParticipants((previous) =>
        previous.filter((participant) => participant.toLowerCase() !== target)
      );
      setBurned((previous) =>
        previous.some((item) => item.toLowerCase() === target) ? previous : [...previous, username]
      );
      if (currentWinner?.toLowerCase() === target) {
        setCurrentWinner(null);
        setSpinRequest(null);
      }
    },
    [currentWinner, isSpinning]
  );

  const restoreParticipant = useCallback(
    (username: string) => {
      const target = username.toLowerCase();

      setBurned((previous) => previous.filter((item) => item.toLowerCase() !== target));
      setParticipants((previous) => {
        if (previous.some((item) => item.toLowerCase() === target)) return previous;

        const source = baseParticipants.length > 0 ? baseParticipants : previous;
        const entries = source.filter((item) => item.toLowerCase() === target);
        const isBonus = bonusUsers.some((item) => item.toLowerCase() === target);
        const restored =
          entries.length > 0
            ? isBonus
              ? entries.flatMap((entry) => [entry, entry])
              : entries
            : isBonus
              ? [username, username]
              : [username];

        return [...previous, ...restored].sort((a, b) =>
          a.localeCompare(b, 'es', { sensitivity: 'base' })
        );
      });
    },
    [baseParticipants, bonusUsers]
  );

  const reset = useCallback(() => {
    setParticipants([]);
    setBaseParticipants([]);
    setBonusUsers([]);
    setStarted(false);
    setBurned([]);
    setHistory([]);
    setCurrentWinner(null);
    setSpinRequest(null);
    setIsSpinning(false);
    setError(null);
    setLastMeta(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sin persistencia disponible
    }
  }, []);

  return {
    participants,
    baseParticipants,
    bonusUsers,
    started,
    burned,
    history,
    currentWinner,
    spinRequest,
    isSpinning,
    error,
    lastMeta,
    setRoster,
    toggleBonus,
    clearBonus,
    startRaffle,
    reroll,
    burnWinner,
    completeSpin,
    removeParticipant,
    restoreParticipant,
    clearError,
    setError,
    reset,
  };
}
