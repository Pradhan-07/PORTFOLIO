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
  category: 'c++' | 'ai' | 'web';
  language: string;
  description: string;
  details: string;
  tech: string[];
  githubUrl: string;
  demoUrl?: string;
  snippet?: string;
  stats?: {
    stars?: number;
    updated?: string;
    status: string;
  };
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
