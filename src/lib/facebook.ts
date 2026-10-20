import type { FacebookPage, InstagramAccount } from '../types';
import { appConfig } from './config';

interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest?: string;
  userID: string;
  grantedScopes?: string;
}

export interface FacebookLoginStatus {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse: FacebookAuthResponse | null;
}

export interface FacebookSdk {
  init(options: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
    autoLogAppEvents?: boolean;
  }): void;
  login(
    callback: (response: FacebookLoginStatus) => void,
    options?: { scope: string; return_scopes?: boolean }
  ): void;
  logout(callback: (response: unknown) => void): void;
  getLoginStatus(
    callback: (response: FacebookLoginStatus) => void,
    roundtrip?: boolean
  ): void;
}

interface FacebookPagesResponse {
  data: Array<{
    id: string;
    name: string;
    access_token?: string;
    instagram_business_account?: InstagramAccount;
  }>;
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

export class FacebookError extends Error {
  code: string;

  constructor(message: string, code = 'FACEBOOK_ERROR') {
    super(message);
    this.name = 'FacebookError';
    this.code = code;
  }
}

interface FacebookConfig {
  appId: string;
  version: string;
  locale?: string;
}

let sdkPromise: Promise<FacebookSdk> | null = null;
let sdkKey = '';
let initializedKey = '';

function initializeSdk(sdk: FacebookSdk, config: FacebookConfig): FacebookSdk {
  const key = `${config.appId}:${config.version}`;
  if (initializedKey === key) return sdk;

  sdk.init({
    appId: config.appId,
    cookie: true,
    xfbml: false,
    version: config.version,
    autoLogAppEvents: true,
  });
  initializedKey = key;

  return sdk;
}

export function loadFacebookSdk(config: FacebookConfig): Promise<FacebookSdk> {
  if (!config.appId) {
    return Promise.reject(
      new FacebookError('Falta configurar VITE_INSTAGRAM_APP_ID.', 'MISSING_APP_ID')
    );
  }

  const key = `${config.appId}:${config.version}:${config.locale ?? 'es_ES'}`;
  if (sdkPromise && sdkKey === key) return sdkPromise;

  sdkKey = key;

  if (window.FB) {
    sdkPromise = Promise.resolve(initializeSdk(window.FB, config));
    return sdkPromise;
  }

  sdkPromise = new Promise<FacebookSdk>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      finish(
        new FacebookError(
          'Facebook no respondió. Desactiva bloqueadores de contenido o revisa tu conexión.',
          'SDK_TIMEOUT'
        )
      );
    }, 15000);

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);

      if (error) {
        document.getElementById('facebook-jssdk')?.remove();
        reject(error);
        return;
      }

      if (!window.FB) {
        document.getElementById('facebook-jssdk')?.remove();
        reject(
          new FacebookError(
            'El SDK de Facebook no se cargó correctamente. Recarga la página e inténtalo de nuevo.',
            'SDK_NOT_AVAILABLE'
          )
        );
        return;
      }

      try {
        resolve(initializeSdk(window.FB, config));
      } catch {
        reject(
          new FacebookError('No se pudo inicializar Facebook Login.', 'SDK_INIT_FAILED')
        );
      }
    }

    window.fbAsyncInit = () => finish();

    const existing = document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => finish(), { once: true });
      existing.addEventListener(
        'error',
        () =>
          finish(
            new FacebookError(
              'No se pudo cargar el SDK de Facebook. Revisa tu conexión.',
              'SDK_LOAD_FAILED'
            )
          ),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = `https://connect.facebook.net/${config.locale ?? 'es_ES'}/sdk.js`;
    script.onerror = () =>
      finish(
        new FacebookError(
          'No se pudo cargar el SDK de Facebook. Desactiva bloqueadores de contenido e inténtalo de nuevo.',
          'SDK_LOAD_FAILED'
        )
      );
    document.head.appendChild(script);
  });

  const pending = sdkPromise;
  sdkPromise = pending.catch((error: unknown) => {
    sdkPromise = null;
    sdkKey = '';
    throw error;
  });

  return sdkPromise;
}

export async function getFacebookLoginStatus(
  sdk: FacebookSdk
): Promise<FacebookLoginStatus> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () =>
        reject(
          new FacebookError(
            'Facebook tardó demasiado en responder. Recarga la página e inténtalo de nuevo.',
            'STATUS_TIMEOUT'
          )
        ),
      15000
    );

    sdk.getLoginStatus((response) => {
      window.clearTimeout(timeout);
      resolve(response);
    });
  });
}

export async function loginWithFacebook(
  sdk: FacebookSdk,
  scopes: string[]
): Promise<FacebookLoginStatus> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () =>
        reject(
          new FacebookError('La ventana de Facebook caducó. Inténtalo de nuevo.', 'LOGIN_TIMEOUT')
        ),
      180000
    );

    sdk.login(
      (response) => {
        window.clearTimeout(timeout);
        resolve(response);
      },
      { scope: scopes.join(','), return_scopes: true }
    );
  });
}

export async function logoutFromFacebook(sdk: FacebookSdk): Promise<void> {
  await new Promise<void>((resolve) => {
    sdk.logout(() => resolve());
  });
}

export function getAccessToken(response: FacebookLoginStatus): string | null {
  return response.status === 'connected' && response.authResponse?.accessToken
    ? response.authResponse.accessToken
    : null;
}

export async function fetchFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  const pages: FacebookPage[] = [];
  let nextUrl: string | null =
    `https://graph.facebook.com/${appConfig.graphVersion}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${encodeURIComponent(accessToken)}`;
  let pagesRead = 0;

  while (nextUrl && pagesRead < 20) {
    let response: Response;

    try {
      response = await fetch(nextUrl);
    } catch {
      throw new FacebookError(
        'No se pudieron consultar tus páginas de Facebook. Revisa tu conexión.',
        'PAGES_NETWORK_ERROR'
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | (FacebookPagesResponse & { error?: { message?: string } })
      | null;

    if (!response.ok || !payload || payload.error) {
      throw new FacebookError(
        payload?.error?.message ??
          'Facebook no devolvió tus páginas. Comprueba los permisos de la app.',
        'PAGES_REQUEST_FAILED'
      );
    }

    for (const page of payload.data ?? []) {
      pages.push({
        id: page.id,
        name: page.name,
        accessToken: page.access_token ?? null,
        instagram: page.instagram_business_account ?? null,
      });
    }

    nextUrl = payload.paging?.next ?? null;
    pagesRead += 1;
  }

  return pages;
}
