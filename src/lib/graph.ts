import { appConfig } from './config';
import { uniqueParticipants } from './bonus';
import type {
  GraphExtractionResult,
  InstagramComment,
  InstagramMedia,
  ParticipantSource,
} from '../types';

interface GraphListResponse<T> {
  data: T[];
  paging?: {
    cursors?: { after?: string; before?: string };
    next?: string;
    previous?: string;
  };
}

interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

const GRAPH_BASE = `https://graph.facebook.com/${appConfig.graphVersion}`;
const MAX_MEDIA_PAGES = 30;
const MAX_COMMENT_PAGES = 200;

export class GraphApiError extends Error {
  code: string;
  detail?: string;

  constructor(message: string, code = 'GRAPH_ERROR', detail?: string) {
    super(message);
    this.name = 'GraphApiError';
    this.code = code;
    this.detail = detail;
  }
}

function friendlyGraphError(payload: GraphErrorBody['error']): GraphApiError {
  const code = payload?.code;
  const detail = payload?.error_user_msg ?? payload?.message;

  if (code === 190) {
    return new GraphApiError(
      'Tu sesión de Facebook ha caducado. Vuelve a conectar la cuenta.',
      'TOKEN_EXPIRED',
      detail
    );
  }

  if (code === 10 || code === 200 || code === 294) {
    return new GraphApiError(
      'La app no tiene permisos suficientes para leer los comentarios. Revisa los permisos de Meta.',
      'MISSING_PERMISSIONS',
      detail
    );
  }

  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return new GraphApiError(
      'Meta ha limitado temporalmente las peticiones. Espera unos minutos e inténtalo de nuevo.',
      'RATE_LIMITED',
      detail
    );
  }

  if (code === 100) {
    return new GraphApiError(
      'Meta rechazó la solicitud. Comprueba que la publicación y la cuenta de Instagram sean válidas.',
      'INVALID_REQUEST',
      detail
    );
  }

  return new GraphApiError(
    detail
      ? `Meta devolvió un error: ${detail}`
      : 'Meta no pudo completar la solicitud. Inténtalo de nuevo.',
    'GRAPH_ERROR',
    detail
  );
}

async function graphRequest<T>(
  path: string,
  accessToken: string,
  params: Record<string, string | undefined> = {}
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\//, '')}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  url.searchParams.set('access_token', accessToken);

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new GraphApiError(
      'No se pudo conectar con Meta. Revisa tu conexión o el bloqueador de contenido.',
      'NETWORK_ERROR'
    );
  }

  const payload = (await response.json().catch(() => null)) as (T & GraphErrorBody) | null;

  if (!response.ok || !payload || payload.error) {
    throw friendlyGraphError(payload?.error);
  }

  return payload;
}

function nextCursor(paging: GraphListResponse<unknown>['paging']): string | null {
  if (paging?.cursors?.after) return paging.cursors.after;
  if (!paging?.next) return null;

  try {
    return new URL(paging.next).searchParams.get('after');
  } catch {
    return null;
  }
}

export async function findAllComments(
  mediaId: string,
  accessToken: string,
  onProgress?: (count: number, page: number) => void
): Promise<InstagramComment[]> {
  const comments: InstagramComment[] = [];
  const seenCursors = new Set<string>();
  let after: string | undefined;

  for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
    const response = await graphRequest<GraphListResponse<InstagramComment>>(
      `${mediaId}/comments`,
      accessToken,
      {
        fields: 'id,text,username,timestamp,like_count',
        limit: '100',
        after,
      }
    );

    comments.push(...(response.data ?? []));
    onProgress?.(comments.length, page);

    if (!response.paging?.next) return comments;

    const cursor = nextCursor(response.paging);
    if (!cursor || seenCursors.has(cursor) || (response.data ?? []).length === 0) {
      return comments;
    }

    seenCursors.add(cursor);
    after = cursor;
  }

  throw new GraphApiError(
    `Se alcanzó el límite de ${MAX_COMMENT_PAGES * 100} comentarios. El sorteo necesita el listado completo.`,
    'COMMENTS_LIMIT_REACHED'
  );
}

export async function findInstagramMediaByShortcode(
  instagramUserId: string,
  shortcode: string,
  accessToken: string,
  onProgress?: (scanned: number, page: number) => void
): Promise<InstagramMedia> {
  const seenCursors = new Set<string>();
  let after: string | undefined;
  let scanned = 0;

  for (let page = 1; page <= MAX_MEDIA_PAGES; page += 1) {
    const response = await graphRequest<GraphListResponse<InstagramMedia>>(
      `${instagramUserId}/media`,
      accessToken,
      {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count',
        limit: '100',
        after,
      }
    );

    scanned += response.data?.length ?? 0;
    onProgress?.(scanned, page);

    const media = (response.data ?? []).find(
      (item) => item.permalink && extractInstagramShortcode(item.permalink) === shortcode
    );

    if (media) return media;

    if (!response.paging?.next) break;

    const cursor = nextCursor(response.paging);
    if (!cursor || seenCursors.has(cursor) || (response.data ?? []).length === 0) break;

    seenCursors.add(cursor);
    after = cursor;
  }

  throw new GraphApiError(
    'No encontramos esa publicación en la cuenta de Instagram conectada. Comprueba el enlace y la página.',
    'MEDIA_NOT_FOUND'
  );
}

export function extractInstagramShortcode(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  if (/^[A-Za-z0-9_-]{5,}$/.test(value)) return value;

  let url: URL;

  try {
    url = new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'instagram.com' && host !== 'instagr.am') return null;

  const match = url.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return match?.[1] ?? null;
}

export function extractMentions(text: string): string[] {
  const matches = text.matchAll(/(?:^|[^A-Za-z0-9_.])@([A-Za-z0-9_.]{1,30})/g);
  const mentions: string[] = [];

  for (const match of matches) {
    const username = normalizeUsername(match[1]);
    if (username) mentions.push(username);
  }

  return [...new Set(mentions)];
}

export function normalizeUsername(value: string | undefined): string | null {
  if (!value) return null;

  const username = value
    .trim()
    .replace(/^@/, '')
    .replace(/[.,;:!?]+$/, '')
    .toLowerCase();

  return /^[a-z0-9._]+$/.test(username) ? username : null;
}

export function commentsToParticipants(
  comments: InstagramComment[],
  source: ParticipantSource,
  unique: boolean
): string[] {
  const participants: string[] = [];

  for (const comment of comments) {
    const candidates =
      source === 'mentions'
        ? extractMentions(comment.text ?? '')
        : [normalizeUsername(comment.username)].filter((username): username is string =>
            Boolean(username)
          );

    for (const username of candidates) {
      participants.push(username);
    }
  }

  return unique ? uniqueParticipants(participants) : participants;
}

export async function extractPostParticipants(options: {
  instagramUserId: string;
  instagramUsername: string;
  pageName: string;
  accessToken: string;
  postUrl: string;
  source: ParticipantSource;
  unique: boolean;
  onStage: (message: string) => void;
}): Promise<GraphExtractionResult> {
  const startedAt = Date.now();
  const shortcode = extractInstagramShortcode(options.postUrl);

  if (!shortcode) {
    throw new GraphApiError(
      'El enlace no parece una publicación de Instagram. Usa una URL con /p/, /reel/ o /tv/.',
      'INVALID_URL'
    );
  }

  options.onStage('Buscando la publicación en Instagram...');

  const media = await findInstagramMediaByShortcode(
    options.instagramUserId,
    shortcode,
    options.accessToken,
    (scanned) => options.onStage(`Revisando publicaciones... ${scanned} encontradas.`)
  );

  options.onStage('Leyendo todos los comentarios...');

  const comments = await findAllComments(media.id, options.accessToken, (count, page) =>
    options.onStage(`Cargando comentarios... ${count} leídos (página ${page}).`)
  );

  if (comments.length === 0) {
    throw new GraphApiError('La publicación no tiene comentarios para sortear.', 'NO_COMMENTS');
  }

  const participants = commentsToParticipants(comments, options.source, options.unique);

  if (participants.length === 0) {
    throw new GraphApiError(
      options.source === 'mentions'
        ? 'Ningún comentario menciona a otro usuario con @.'
        : 'No se pudo identificar a los autores de los comentarios.',
      'NO_PARTICIPANTS'
    );
  }

  return {
    participants,
    meta: {
      shortcode,
      url: options.postUrl,
      comments: comments.length,
      users: uniqueParticipants(participants).length,
      participantSource: options.source,
      pageName: options.pageName,
      instagramUsername: options.instagramUsername,
      mediaId: media.id,
      durationMs: Date.now() - startedAt,
    },
  };
}
