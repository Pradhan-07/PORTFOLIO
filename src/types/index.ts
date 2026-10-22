export interface Theme {
  name: string;
  label: string;
  light?: boolean;
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  chrome: string;
  line: string;
  kinds: {
    keyword: string;
    string: string;
    number: string;
    function: string;
    type: string;
    comment: string;
    text: string;
    member?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  category: 'c++' | 'ai' | 'web' | 'iot';
  language: string;
  description: string;
  details: string;
  tech: string[];
  githubUrl?: string;
  demoUrl?: string;
  snippet?: string;
  features?: string[];
  featured?: boolean;
  stats?: {
    stars?: number;
    updated?: string;
    status: string;
  };
}

export interface Certification {
  id: string;
  name: string;
  credential: string;
  issuer: string;
  issued: string;
}

export type EditorFileId =
  | 'about'
  | 'certifications'
  | 'projects'
  | 'stack'
  | 'journey'
  | 'leetcode'
  | 'themes'
  | 'contact';

export interface EditorFileSpec {
  id: EditorFileId;
  /** Legacy section id this file maps to (status bar, commands, anchors). */
  section: string;
  file: string;
  language: string;
  kind: string;
  dot: string;
}

/** Token kinds shared by the code wall and the snippet fallback data. */
export type CodeTokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'function'
  | 'type'
  | 'comment'
  | 'text'
  | 'member';

export interface CodeToken {
  text: string;
  kind: CodeTokenKind;
}

export interface CodeLineTokens {
  text: string;
  tokens: CodeToken[];
}

/**
 * One real source file on the intro code wall (G12), as recorded in
 * `public/data/wall.json`. `sha` is the blob SHA (content identity);
 * `commit` is the repo HEAD the blob URL is built from. `lines` is the
 * FULL file's line count — for excerpted files (>8 KB, first 100 lines)
 * `tokens` carries fewer lines and `excerpt` says so, in the data and in
 * the sr-only sources nav. All values are generator-computed.
 */
export interface WallFile {
  repo: string;
  path: string;
  sha: string;
  commit: string;
  lang: string;
  bytes: number;
  lines: number;
  firstLine: string;
  blobUrl: string;
  excerpt: boolean;
  tokens: CodeLineTokens[];
}

export interface WallData {
  fetchedAt: string;
  source: string;
  repos: Record<string, { commit: string; htmlUrl: string }>;
  files: WallFile[];
}

export interface FocusArea {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  topics: string[];
  status: string;
}

export interface LearningItem {
  id: string;
  title: string;
  domain: string;
  status: 'In Progress' | 'Exploring' | 'Practicing';
  notes: string;
  tag: string;
}
