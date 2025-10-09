// Types for OpenPecha API response
export interface AltTitle {
  [language: string]: string;
}

export interface Contribution {
  person_bdrc_id: string;
  person_id: string;
  role: string;
}

export interface Title {
  [language: string]: string;
}

export interface OpenPechaText {
  alt_titles: AltTitle[];
  bdrc: string;
  contributions: Contribution[];
  date: string | null;
  id: string;
  language: string;
  parent: string | null;
  title: Title;
  type: string;
  wiki: string | null;
}

export interface Span {
  end: number;
  start: number;
}

export interface SegmentationAnnotation {
  id: string;
  index: number;
  span: Span;
}

export interface Annotations {
  [key: string]: unknown[];
}

export interface OpenPechaTextInstance {
  alignment_sources: string[];
  alignment_targets: string[];
  alt_incipit_titles: string | null;
  annotations: Annotations;
  base: string;
  bdrc: string | null;
  colophon: string | null;
  copyright: string;
  id: string;
  incipit_title: string | null;
  type: string;
  wiki: string | null;
}