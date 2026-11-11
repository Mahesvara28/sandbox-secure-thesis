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
  { type: 'tip', title: 'A failed sign-in is an attempt, not proof that an account was accessed.', source: 'Evidence check', relatedConcept: 'authentication' },
  { type: 'tip', title: 'Compare a service with the approved list before deciding it is unusual.', source: 'Baseline check', relatedConcept: 'baselines' },
  { type: 'tip', title: 'A web error can show that a request was denied; it does not identify who sent it.', source: 'Log reading', relatedConcept: 'web logs' },
  { type: 'tip', title: 'Save relevant records before containment so the response does not erase useful context.', source: 'Response practice', relatedConcept: 'evidence preservation' },
  { type: 'tip', title: 'A listening port shows that a service is available; check its owner and expected use.', source: 'Network check', relatedConcept: 'services' },
  { type: 'tip', title: 'Use timestamps and a second source to confirm that events belong to the same sequence.', source: 'Timeline check', relatedConcept: 'correlation' },
  { type: 'tip', title: 'When logs are missing, report what is unknown instead of treating the gap as proof.', source: 'Reporting practice', relatedConcept: 'uncertainty' },
  { type: 'tip', title: 'Choose the narrowest response that addresses the evidence and preserves normal work.', source: 'Containment practice', relatedConcept: 'scoped response' }
];

export const SECURITY_BRIEF_ITEMS = [...SECURITY_BRIEF_NEWS, ...SECURITY_BRIEF_TIPS];
