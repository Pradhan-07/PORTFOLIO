import type { EditorFileSpec } from '../types';

// The portfolio's sections modelled as files in one editor.
// Order here is the file-tree order and the wheel/keyboard stepping order.
export const EDITOR_FILES: EditorFileSpec[] = [
  { id: 'about', section: 'about', file: 'about.tsx', language: 'TypeScript JSX', kind: 'TSX', dot: '#3178c6' },
  { id: 'certifications', section: 'certifications', file: 'certifications.md', language: 'Markdown', kind: 'MD', dot: '#66cc6a' },
  { id: 'projects', section: 'projects', file: 'projects.tsx', language: 'TypeScript JSX', kind: 'TSX', dot: '#3178c6' },
  { id: 'stack', section: 'skills', file: 'stack.ts', language: 'TypeScript', kind: 'TS', dot: '#e8c268' },
  { id: 'journey', section: 'journey', file: 'journey.log', language: 'Log', kind: 'LOG', dot: '#a9a49a' },
  { id: 'leetcode', section: 'leetcode', file: 'leetcode.tsx', language: 'TypeScript JSX', kind: 'TSX', dot: '#3178c6' },
  { id: 'themes', section: 'themes', file: 'themes.ts', language: 'TypeScript', kind: 'TS', dot: '#c586c0' },
  { id: 'contact', section: 'contact', file: 'contact.tsx', language: 'TypeScript JSX', kind: 'TSX', dot: '#3178c6' },
];
