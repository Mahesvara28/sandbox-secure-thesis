export interface SecurityBriefItem {
  type: 'news' | 'tip';
  title: string;
  source: string;
  date?: string;
  link?: string;
  relatedConcept?: string;
}

export const SECURITY_BRIEF_NEWS: SecurityBriefItem[] = [];

export const SECURITY_BRIEF_TIPS: SecurityBriefItem[] = [
  { type: 'tip', title: 'Verify before acting.', source: 'Security practice', relatedConcept: 'verification' },
  { type: 'tip', title: 'Compare activity with an approved baseline.', source: 'Security practice', relatedConcept: 'baselines' },
  { type: 'tip', title: 'Separate observations from conclusions.', source: 'Security practice', relatedConcept: 'evidence' }
];

export const SECURITY_BRIEF_ITEMS = [...SECURITY_BRIEF_NEWS, ...SECURITY_BRIEF_TIPS];
