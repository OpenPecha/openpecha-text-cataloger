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
