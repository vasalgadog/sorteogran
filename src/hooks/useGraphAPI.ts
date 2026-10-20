import { useCallback, useEffect, useState } from 'react';
import { appConfig } from '../lib/config';
import {
  FacebookError,
  fetchFacebookPages,
  getAccessToken,
  getFacebookLoginStatus,
  loadFacebookSdk,
  loginWithFacebook,
  logoutFromFacebook,
  type FacebookSdk,
} from '../lib/facebook';
import { GraphApiError, extractPostParticipants } from '../lib/graph';
import type {
  FacebookPage,
  GraphExtractionResult,
  ParticipantSource,
} from '../types';

export type GraphStatus =
  | 'config_missing'
  | 'insecure'
  | 'initializing'
  | 'anonymous'
  | 'connected'
  | 'error';

const IS_SECURE_CONTEXT =
  typeof window === 'undefined' || window.location.protocol === 'https:';

function messageFromError(error: unknown): string {
  if (error instanceof FacebookError || error instanceof GraphApiError) {
    return error.message;
  }

  return 'No se pudo completar la conexión con Instagram. Inténtalo de nuevo.';
}

export function useGraphAPI() {
  const [status, setStatus] = useState<GraphStatus>(
    !appConfig.instagramAppId ? 'config_missing' : IS_SECURE_CONTEXT ? 'initializing' : 'insecure'
  );
  const [sdk, setSdk] = useState<FacebookSdk | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');

  const commitPages = useCallback((list: FacebookPage[], token: string) => {
    setAccessToken(token);
    setPages(list);
    setSelectedPageId((previous) => {
      if (list.some((page) => page.id === previous)) return previous;
      return list.find((page) => page.instagram)?.id ?? list[0]?.id ?? '';
    });
    setStatus('connected');
  }, []);

  useEffect(() => {
    if (!appConfig.instagramAppId || !IS_SECURE_CONTEXT) {
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        setStage('Conectando con Facebook...');
        const facebook = await loadFacebookSdk({
          appId: appConfig.instagramAppId,
          version: appConfig.graphVersion,
        });

        if (cancelled) return;
        setSdk(facebook);

        const loginStatus = await getFacebookLoginStatus(facebook);
        if (cancelled) return;

        const token = getAccessToken(loginStatus);
        if (!token) {
          setStatus('anonymous');
          return;
        }

        setStage('Buscando tus páginas...');
        const pageList = await fetchFacebookPages(token);
        if (cancelled) return;

        commitPages(pageList, token);
      } catch (caught) {
        if (cancelled) return;
        setError(messageFromError(caught));
        setStatus('error');
      } finally {
        if (!cancelled) setStage('');
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [commitPages]);

  const login = useCallback(async () => {
    if (!appConfig.instagramAppId) {
      setStatus('config_missing');
      return;
    }

    if (!IS_SECURE_CONTEXT) {
      setStatus('insecure');
      return;
    }

    setBusy(true);
    setError('');
    setStage('Abriendo Facebook Login...');

    try {
      const facebook =
        sdk ??
        (await loadFacebookSdk({
          appId: appConfig.instagramAppId,
          version: appConfig.graphVersion,
        }));

      setSdk(facebook);
      setStage('Esperando autorización...');

      const loginStatus = await loginWithFacebook(facebook, appConfig.scopes);
      const token = getAccessToken(loginStatus);

      if (!token) {
        throw new FacebookError(
          'No se autorizó el acceso a Facebook. Acepta los permisos para poder leer los comentarios.',
          'LOGIN_CANCELLED'
        );
      }

      setStage('Buscando tus páginas...');
      const pageList = await fetchFacebookPages(token);
      commitPages(pageList, token);
    } catch (caught) {
      setError(messageFromError(caught));
      setStatus('error');
    } finally {
      setBusy(false);
      setStage('');
    }
  }, [commitPages, sdk]);

  const logout = useCallback(async () => {
    if (sdk) {
      try {
        await logoutFromFacebook(sdk);
      } catch {}
    }

    setAccessToken(null);
    setPages([]);
    setSelectedPageId('');
    setError('');
    setStage('');
    setStatus(
      !appConfig.instagramAppId
        ? 'config_missing'
        : IS_SECURE_CONTEXT
          ? 'anonymous'
          : 'insecure'
    );
  }, [sdk]);

  const refreshPages = useCallback(async () => {
    if (!accessToken) {
      await login();
      return;
    }

    setBusy(true);
    setError('');
    setStage('Actualizando páginas...');

    try {
      const pageList = await fetchFacebookPages(accessToken);
      commitPages(pageList, accessToken);
    } catch (caught) {
      setError(messageFromError(caught));
    } finally {
      setBusy(false);
      setStage('');
    }
  }, [accessToken, commitPages, login]);

  const selectPage = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setError('');
  }, []);

  const extract = useCallback(
    async (
      postUrl: string,
      unique: boolean,
      source: ParticipantSource
    ): Promise<GraphExtractionResult> => {
      const page = pages.find((item) => item.id === selectedPageId) ?? null;

      if (!page?.instagram) {
        const missingPageError = new GraphApiError(
          'Selecciona una página con una cuenta de Instagram profesional vinculada.',
          'NO_INSTAGRAM_ACCOUNT'
        );
        setError(missingPageError.message);
        throw missingPageError;
      }

      const token = page.accessToken ?? accessToken;

      if (!token) {
        const missingTokenError = new GraphApiError(
          'No hay una sesión de Facebook activa. Vuelve a conectar la cuenta.',
          'NO_TOKEN'
        );
        setError(missingTokenError.message);
        throw missingTokenError;
      }

      setBusy(true);
      setError('');
      setStage('Preparando la extracción...');

      try {
        return await extractPostParticipants({
          instagramUserId: page.instagram.id,
          instagramUsername: page.instagram.username,
          pageName: page.name,
          accessToken: token,
          postUrl,
          source,
          unique,
          onStage: setStage,
        });
      } catch (caught) {
        setError(messageFromError(caught));
        throw caught;
      } finally {
        setBusy(false);
        setStage('');
      }
    },
    [accessToken, pages, selectedPageId]
  );

  const selectedPage =
    pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null;

  return {
    status,
    pages,
    selectedPage,
    selectedPageId,
    error,
    busy,
    stage,
    login,
    logout,
    refreshPages,
    selectPage,
    extract,
  };
}
