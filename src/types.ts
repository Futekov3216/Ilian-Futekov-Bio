/** The five zones drawn on the blueprint, in navigation order. */
export const ZONE_KEYS = ['about', 'experience', 'education', 'skills', 'contact'] as const;
export type ZoneKey = (typeof ZONE_KEYS)[number];

/** Rise height preset of a zone block (72, 52 or 96 px — see `RISE` in `three/BlueprintScene.ts`). */
export type ZoneHeight = 'a' | 'b' | 'c';

/** Position and size of a zone on the 900 × 600 blueprint plane, in px. */
export interface ZoneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZoneMeta {
  key: ZoneKey;
  /** Sheet title shown in the overlay bar. */
  title: string;
  /** Upper-case short name for navigation buttons. */
  short: string;
  /** Extra-short name for very narrow phones. */
  abbr: string;
  /** Label engraved on the zone, e.g. "EXPERIENCE". */
  label: string;
  /** Hologram card: title and sub line. */
  tipTitle: string;
  tipSub: string;
  rect: ZoneRect;
  height: ZoneHeight;
  /** Start delay (s) of the intro rise wave. */
  introDelay: number;
}

export interface Role {
  role: string;
  company: string;
  dates: string;
  points: string[];
  tags: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  period: string;
  shortPeriod: string;
  courses: string[];
  facts: Fact[];
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Fact {
  k: string;
  v: string;
}

export interface ContactLink {
  k: string;
  v: string;
  href: string;
}

export interface Profile {
  name: string;
  role: string;
  site: string;
  email: string;
  location: string;
  intro: string;
  bio: string;
  facts: Fact[];
  linkedin: string;
  github: string;
}
