export interface WinnerRecord {
  username: string;
  at: number;
}

export type ParticipantSource = 'authors' | 'mentions';

export interface InstagramAccount {
  id: string;
  username: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string | null;
  instagram: InstagramAccount | null;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
}

export interface InstagramComment {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
  like_count?: number;
}

export interface GraphExtractionMeta {
  shortcode: string;
  url: string;
  comments: number;
  users: number;
  participantSource: ParticipantSource;
  pageName: string;
  instagramUsername: string;
  mediaId: string;
  durationMs: number;
}

export interface GraphExtractionResult {
  participants: string[];
  meta: GraphExtractionMeta;
}
