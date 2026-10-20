import type { ParticipantSource } from '../types';

const DEFAULT_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_comments',
];

function parseScopes(value: string | undefined): string[] {
  const scopes = (value ?? '')
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  return scopes.length > 0 ? [...new Set(scopes)] : DEFAULT_SCOPES;
}

function parseVersion(value: string | undefined): string {
  const version = (value ?? '').trim();
  if (!version) return 'v23.0';
  return version.startsWith('v') ? version : `v${version}`;
}

function parseSource(value: string | undefined): ParticipantSource {
  return value === 'mentions' ? 'mentions' : 'authors';
}

export const appConfig = {
  instagramAppId: (import.meta.env.VITE_INSTAGRAM_APP_ID as string | undefined)?.trim() ?? '',
  graphVersion: parseVersion(import.meta.env.VITE_FB_GRAPH_VERSION as string | undefined),
  scopes: parseScopes(import.meta.env.VITE_FB_SCOPES as string | undefined),
  participantSource: parseSource(
    import.meta.env.VITE_PARTICIPANT_SOURCE as string | undefined
  ),
};
