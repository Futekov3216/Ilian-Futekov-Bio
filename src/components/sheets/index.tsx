import type { ComponentType } from 'react';
import type { ZoneKey } from '../../types';
import { AboutSheet } from './AboutSheet';
import { ContactSheet } from './ContactSheet';
import { EducationSheet } from './EducationSheet';
import { ExperienceSheet } from './ExperienceSheet';
import { SkillsSheet } from './SkillsSheet';

/** Which content component each zone's sheet renders. */
export const SHEETS: Record<ZoneKey, ComponentType> = {
  about: AboutSheet,
  experience: ExperienceSheet,
  education: EducationSheet,
  skills: SkillsSheet,
  contact: ContactSheet,
};
