import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { getAdminAnalyticsSnapshot, getAdminIssueReports, setAdminIssueReportStatus, type AdminAnalyticsParticipant, type MissionAttemptRecord, type PlayerIssueReport } from '../Firebase';
import { BRIDGE_MISSIONS, MISSIONS } from '../data/gameData';

type AdminTab = 'overview' | 'learning' | 'missions' | 'participants' | 'issues';
const tiers = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const;
const percent = (score: number, total: number) => total > 0 ? Math.round(score / total * 100) : null;
const median = (values: number[]) => {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : Math.round((ordered[middle - 1] + ordered[middle]) / 2);
};
const attemptDate = (attempt: MissionAttemptRecord) => Date.parse(attempt.completedAt || attempt.startedAt || '');

export default function AdminDashboard({ uid }: { uid: string }) {
  const [participants, setParticipants] = useState<AdminAnalyticsParticipant[]>([]);
  const [issueReports, setIssueReports] = useState<PlayerIssueReport[]>([]);
  const [issueReportsError, setIssueReportsError] = useState('');
  const [updatingReportId, setUpdatingReportId] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [search, setSearch] = useState('');
  const [participantPage, setParticipantPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setParticipants(await getAdminAnalyticsSnapshot(uid));
      try {
        setIssueReports(await getAdminIssueReports(uid));
        setIssueReportsError('');
      } catch {
        setIssueReportsError('Issue reports are unavailable. Publish the issueReports rules from firestore.rules, then refresh.');
      }
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : '';
      setError(code === 'ADMIN_ACCESS_REQUIRED'
        ? 'Admin access is not enabled for this account.'
        : 'Analytics could not be loaded. Confirm the admin Firestore rules and try again.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const updateReportStatus = async (report: PlayerIssueReport) => {
    setUpdatingReportId(report.id);
    setIssueReportsError('');
    try {
      const status = report.status === 'open' ? 'resolved' : 'open';
      await setAdminIssueReportStatus(uid, report.id, status);
      setIssueReports(current => current.map(item => item.id === report.id ? { ...item, status } : item));
    } catch {
      setIssueReportsError('Could not update this report. Check the admin Firestore rules and try again.');
    } finally {
      setUpdatingReportId('');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const analysis = useMemo(() => {
    const missionAttempts = participants.flatMap(person => person.missionAttempts);
    const assessmentAttempts = participants.flatMap(person => person.assessmentAttempts);
    const learnerKeys = (assessment: 'pre' | 'post') => new Set(participants.flatMap(person => person.assessmentAttempts
      .filter(attempt => attempt.assessment === assessment)
      .map(attempt => `${person.uid}:${attempt.tier}`)));
    const learnersWithPre = learnerKeys('pre');
    const learnersWithPost = learnerKeys('post');
    const passCounts = Object.fromEntries(tiers.map(tier => [tier, participants.filter(person => {
      const score = person.scores[tier] as Record<string, unknown> | undefined;
      const finalScore = Number(score?.finalScore ?? score?.score ?? 0);
      const total = Number(score?.finalTotal ?? score?.total ?? 0);
      const required = [...(tier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === tier)].map(mission => mission.id);
      return total > 0 && finalScore / total >= 0.7 && required.length > 0 && required.every(id => person.completedMissions.includes(id));
    }).length]));
    const learning = tiers.map(tier => {
      const pairs = participants.flatMap(person => {
        const attempts = person.assessmentAttempts.filter(item => item.tier === tier).sort((a, b) => a.attemptNumber - b.attemptNumber);
        const firstPre = attempts.find(item => item.assessment === 'pre');
        const firstPost = attempts.find(item => item.assessment === 'post');
        if (!firstPre || !firstPost) return [];
        const pre = percent(firstPre.score, firstPre.total);
        const post = percent(firstPost.score, firstPost.total);
        return pre === null || post === null ? [] : [{ pre, post, gain: post - pre }];
      });
      const latestSaved = participants.flatMap(person => {
        const score = person.scores[tier] as Record<string, unknown> | undefined;
        const pre = percent(Number(score?.preTestFirstScore ?? score?.preTestScore ?? 0), Number(score?.preTestFirstTotal ?? score?.preTestTotal ?? 0));
        const post = percent(Number(score?.firstFinalScore ?? score?.finalScore ?? 0), Number(score?.firstFinalTotal ?? score?.finalTotal ?? 0));
        return pre !== null && post !== null ? [{ pre, post, gain: post - pre }] : [];
      });
      const source = pairs.length ? pairs : latestSaved;
      return { tier, count: source.length, pre: source.length ? Math.round(source.reduce((sum, row) => sum + row.pre, 0) / source.length) : null, post: source.length ? Math.round(source.reduce((sum, row) => sum + row.post, 0) / source.length) : null, gain: source.length ? Math.round(source.reduce((sum, row) => sum + row.gain, 0) / source.length) : null };
    });
    const grouped = new Map<string, MissionAttemptRecord[]>();
    missionAttempts.forEach(attempt => grouped.set(attempt.missionId, [...(grouped.get(attempt.missionId) ?? []), attempt]));
    const missions = [...grouped.entries()].map(([missionId, records]) => {
      const completed = records.filter(attempt => attempt.outcome === 'completed');
      const errors = records.reduce((sum, attempt) => sum + Object.values(attempt.wrongCommandsByStep ?? {}).reduce((total, value) => total + Number(value || 0), 0), 0);
      return { missionId, title: records[0]?.missionTitle ?? missionId, tier: records[0]?.tier ?? '', attempts: records.length, completed: completed.length, rate: records.length ? Math.round(completed.length / records.length * 100) : 0, medianSeconds: median(completed.map(item => item.totalTimeSeconds)), hints: records.length ? (records.reduce((sum, item) => sum + item.hintsOpened, 0) / records.length).toFixed(1) : '0', wrongCommands: errors, abandoned: records.filter(item => item.outcome === 'abandoned').length, timedOut: records.filter(item => item.outcome === 'timed_out').length };
    }).sort((a, b) => a.tier.localeCompare(b.tier) || a.title.localeCompare(b.title));
    const participantRows = [...participants].sort((a, b) => a.uid.localeCompare(b.uid)).map((person, index) => {
      const lastActivity = Math.max(0, ...person.missionAttempts.map(attemptDate), ...person.assessmentAttempts.map(attempt => Date.parse(attempt.timestamp || '')));
      const latestScore = person.assessmentAttempts.filter(item => item.assessment === 'post').sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
      const latestPre = person.assessmentAttempts.filter(item => item.assessment === 'pre' && item.tier === latestScore?.tier).sort((a, b) => a.attemptNumber - b.attemptNumber)[0];
      const postPercent = latestScore ? percent(latestScore.score, latestScore.total) : null;
      const prePercent = latestPre ? percent(latestPre.score, latestPre.total) : null;
      const required = latestScore ? [...(latestScore.tier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === latestScore.tier)].map(mission => mission.id) : [];
      const tierPassed = latestScore !== undefined && postPercent !== null && postPercent >= 70 && required.length > 0 && required.every(id => person.completedMissions.includes(id));
      return { id: `Learner ${String(index + 1).padStart(3, '0')}`, name: person.username, lastActivity, missionCount: person.missionAttempts.length, tier: latestScore?.tier ?? '—', preScore: prePercent === null ? '—' : `${prePercent}%`, postScore: postPercent === null ? '—' : `${postPercent}%`, status: latestScore ? (tierPassed ? 'Passed' : 'Not passed') : 'No post-test' };
    });
    return { missionAttempts, assessmentAttempts, learnersWithPre: new Set([...learnersWithPre].map(value => value.split(':')[0])).size, learnersWithMissions: new Set(participants.filter(person => person.missionAttempts.length > 0).map(person => person.uid)).size, learnersWithPost: new Set([...learnersWithPost].map(value => value.split(':')[0])).size, passCounts, learning, missions, participantRows };
  }, [participants]);

  const exportSummary = () => {
    const rows = [['Mission', 'Tier', 'Attempts', 'Completions', 'Completion rate (%)', 'Median completion time (seconds)', 'Average hints', 'Wrong commands', 'Abandoned', 'Timed out'], ...analysis.missions.map(row => [row.title, row.tier, row.attempts, row.completed, row.rate, row.medianSeconds ?? '', row.hints, row.wrongCommands, row.abandoned, row.timedOut])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sandbox-secure-admin-mission-summary.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const exportLearnerProgress = () => {
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const headers = [
      'Firebase user ID', 'Display name', 'Account created', 'Certification tier',
      'Missions completed', 'Missions required', 'Pre-test attempts',
      'Latest pre-test score', 'Latest pre-test questions', 'Post-test attempts',
      'Latest post-test score', 'Latest post-test questions',
      'Certification status', 'Last recorded learning activity'
    ];
    const rows = [...participants]
      .sort((a, b) => a.uid.localeCompare(b.uid))
      .flatMap(person => tiers.map(tier => {
        const tierMissions = [...(tier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === tier)];
        const completedCount = tierMissions.filter(mission => person.completedMissions.includes(mission.id)).length;
        const score = person.scores[tier] ?? {};
        const tierAssessments = person.assessmentAttempts
          .filter(attempt => attempt.tier === tier)
          .sort((a, b) => a.attemptNumber - b.attemptNumber || a.timestamp.localeCompare(b.timestamp));
        const preAttempts = tierAssessments.filter(attempt => attempt.assessment === 'pre');
        const postAttempts = tierAssessments.filter(attempt => attempt.assessment === 'post');
        const latestPre = preAttempts.at(-1);
        const latestPost = postAttempts.at(-1);
        const preScore = latestPre?.score ?? score.preTestScore;
        const preTotal = latestPre?.total ?? score.preTestTotal;
        const postScore = latestPost?.score ?? score.finalScore ?? score.score;
        const postTotal = latestPost?.total ?? score.finalTotal ?? score.total;
        const postPercent = typeof postScore === 'number' && typeof postTotal === 'number' && postTotal > 0
          ? postScore / postTotal
          : null;
        const passed = postPercent !== null
          && postPercent >= 0.7
          && tierMissions.length > 0
          && completedCount === tierMissions.length;
        const hasProgress = completedCount > 0 || preAttempts.length > 0 || postAttempts.length > 0
          || score.preTestScore !== undefined || score.finalScore !== undefined || score.score !== undefined;
        const lastActivity = Math.max(
          0,
          ...person.missionAttempts.filter(attempt => attempt.tier === tier).map(attemptDate),
          ...tierAssessments.map(attempt => Date.parse(attempt.timestamp || ''))
        );

        return [
          person.uid,
          person.username,
          person.createdAt ?? '',
          tier,
          completedCount,
          tierMissions.length,
          preAttempts.length || (score.preTestScore !== undefined ? 1 : 0),
          preScore ?? '',
          preTotal ?? '',
          postAttempts.length || (score.finalScore !== undefined || score.score !== undefined ? 1 : 0),
          postScore ?? '',
          postTotal ?? '',
          passed ? 'Passed' : hasProgress ? 'In progress' : 'Not started',
          lastActivity ? new Date(lastActivity).toISOString() : ''
        ];
      }));
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sandbox-secure-all-learner-progress.csv';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const filteredRows = analysis.participantRows.filter(person => `${person.id} ${person.name}`.toLowerCase().includes(search.toLowerCase()));
  const participantPageSize = 10;
  const participantPageCount = Math.max(1, Math.ceil(filteredRows.length / participantPageSize));
  const currentParticipantPage = Math.min(participantPage, participantPageCount);
  const visibleParticipantRows = filteredRows.slice(
    (currentParticipantPage - 1) * participantPageSize,
    currentParticipantPage * participantPageSize
  );
  const firstVisibleParticipant = filteredRows.length ? (currentParticipantPage - 1) * participantPageSize + 1 : 0;
  const lastVisibleParticipant = Math.min(currentParticipantPage * participantPageSize, filteredRows.length);

  return <div className="game-screen mx-auto min-h-full w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <header className="game-card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="game-eyebrow">Restricted · research admin</p><h1 className="text-2xl font-black uppercase text-[var(--game-text)]">Research analytics</h1><p className="mt-2 text-sm text-[var(--game-muted)]">Counts are based on saved player profiles, not recent activity. Emails and raw account IDs are not displayed.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={exportSummary} disabled={!participants.length} className="min-h-10 border border-[var(--game-border)] px-3 text-xs font-bold text-[var(--game-text)] disabled:opacity-50"><Download size={14} className="mr-2 inline" />Export mission summary</button><button type="button" onClick={exportLearnerProgress} disabled={!participants.length} className="min-h-10 border border-[var(--game-cyan)] px-3 text-xs font-bold text-[var(--game-cyan)] disabled:opacity-50"><Download size={14} className="mr-2 inline" />Export all learner progress</button><button type="button" onClick={() => void refresh()} disabled={loading} className="min-h-10 border border-[var(--game-cyan)] px-3 text-xs font-bold text-[var(--game-cyan)] disabled:opacity-50"><RefreshCw size={14} className={`mr-2 inline ${loading ? 'animate-spin' : ''}`} />{loading ? 'Refreshing…' : 'Refresh data'}</button></div>
    </header>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics sections">{([['overview', 'Overview'], ['learning', 'Learning outcomes'], ['missions', 'Missions'], ['participants', 'Participants'], ['issues', `Issue reports · ${issueReports.filter(item => item.status === 'open').length}`]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={`min-h-10 border px-3 text-xs font-bold ${activeTab === id ? 'border-[var(--game-cyan)] text-[var(--game-cyan)]' : 'border-[var(--game-border)] text-[var(--game-muted)]'}`}>{label}</button>)}</div>
    {error && <div role="alert" className="border border-[var(--game-red)] p-4 text-sm text-[var(--game-red)]"><p>{error}</p><p className="mt-2 text-xs">The UI check is not security enforcement. Apply and test the restricted Firestore rules described in ADMIN_DASHBOARD_SETUP.md before using this screen with participant data.</p></div>}
    {!error && !participants.length && activeTab !== 'issues' && <div className="game-card p-6 text-sm text-[var(--game-muted)]">{loading ? 'Loading saved research data…' : 'No saved Firestore user profiles were returned.'}</div>}
    {(participants.length > 0 || activeTab === 'issues') && <>
      {activeTab !== 'issues' && !participants.length && <p className="game-card p-5 text-sm text-[var(--game-muted)]">No saved user profiles are available for analytics.</p>}
      {activeTab === 'overview' && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[['Registered profile records', participants.length], ['With a pre-test', analysis.learnersWithPre], ['With a post-test', analysis.learnersWithPost]].map(([label, value]) => <article key={label} className="game-card p-4"><p className="game-eyebrow">{label}</p><p className="mt-2 text-2xl font-black text-[var(--game-text)]">{value}</p></article>)}</div>
        <section className="game-card p-5"><h2 className="text-lg font-black uppercase text-[var(--game-text)]">Certification pass rates</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{tiers.map(tier => <div key={tier} className="border border-[var(--game-border)] p-3"><p className="text-xs font-bold text-[var(--game-muted)]">{tier}</p><p className="mt-1 text-xl font-black text-[var(--game-text)]">{analysis.passCounts[tier]} / {participants.length}</p><p className="text-xs text-[var(--game-muted)]">passed · requires score and all tier missions</p></div>)}</div></section>
        <section className="game-card p-5"><h2 className="text-lg font-black uppercase text-[var(--game-text)]">Learning funnel</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{[['Registered profiles', participants.length], ['Started a mission', analysis.learnersWithMissions], ['Pre-test recorded', analysis.learnersWithPre], ['Post-test recorded', analysis.learnersWithPost]].map(([label, value]) => <div key={label} className="border-l-2 border-[var(--game-cyan)] pl-3"><p className="text-xs text-[var(--game-muted)]">{label}</p><p className="text-xl font-bold text-[var(--game-text)]">{value}</p></div>)}</div></section>
      </>}
      {activeTab === 'learning' && <section className="game-card overflow-x-auto p-5"><h2 className="text-lg font-black uppercase text-[var(--game-text)]">First-attempt assessment comparison</h2><p className="mt-1 text-sm text-[var(--game-muted)]">Paired learner averages; percentage-point gain is post-test minus pre-test.</p><table className="mt-4 w-full min-w-[620px] text-left text-sm"><thead className="text-xs text-[var(--game-muted)]"><tr>{['Tier', 'Learners paired', 'Pre-test average', 'Post-test average', 'Average gain'].map(label => <th key={label} className="border-b border-[var(--game-border)] p-2">{label}</th>)}</tr></thead><tbody>{analysis.learning.map(row => <tr key={row.tier}><th className="border-b border-[var(--game-border)] p-2">{row.tier}</th><td className="border-b border-[var(--game-border)] p-2">{row.count}</td><td className="border-b border-[var(--game-border)] p-2">{row.pre === null ? '—' : `${row.pre}%`}</td><td className="border-b border-[var(--game-border)] p-2">{row.post === null ? '—' : `${row.post}%`}</td><td className="border-b border-[var(--game-border)] p-2 font-bold">{row.gain === null ? '—' : `${row.gain > 0 ? '+' : ''}${row.gain} pp`}</td></tr>)}</tbody></table><p className="mt-3 text-xs text-[var(--game-muted)]">Question-by-question accuracy is not available: saved assessment attempts contain total scores, not per-question responses. The Google Forms usability survey is also separate from this Firebase data.</p></section>}
      {activeTab === 'missions' && <section className="game-card overflow-x-auto p-5"><h2 className="text-lg font-black uppercase text-[var(--game-text)]">Mission friction and completion</h2><table className="mt-4 w-full min-w-[960px] text-left text-sm"><thead className="text-xs text-[var(--game-muted)]"><tr>{['Mission', 'Tier', 'Attempts', 'Complete', 'Completion rate', 'Median time', 'Hints avg.', 'Wrong commands', 'Abandoned', 'Timed out'].map(label => <th key={label} className="border-b border-[var(--game-border)] p-2">{label}</th>)}</tr></thead><tbody>{analysis.missions.map(row => <tr key={row.missionId}><th className="border-b border-[var(--game-border)] p-2">{row.title}</th><td className="border-b border-[var(--game-border)] p-2">{row.tier}</td><td className="border-b border-[var(--game-border)] p-2">{row.attempts}</td><td className="border-b border-[var(--game-border)] p-2">{row.completed}</td><td className="border-b border-[var(--game-border)] p-2">{row.rate}%</td><td className="border-b border-[var(--game-border)] p-2">{row.medianSeconds === null ? '—' : `${Math.floor(row.medianSeconds / 60)}m ${row.medianSeconds % 60}s`}</td><td className="border-b border-[var(--game-border)] p-2">{row.hints}</td><td className="border-b border-[var(--game-border)] p-2">{row.wrongCommands}</td><td className="border-b border-[var(--game-border)] p-2">{row.abandoned}</td><td className="border-b border-[var(--game-border)] p-2">{row.timedOut}</td></tr>)}</tbody></table></section>}
      {activeTab === 'participants' && <section className="game-card overflow-x-auto p-5"><h2 className="text-lg font-black uppercase text-[var(--game-text)]">Registered profile records</h2><p className="mt-1 text-xs leading-5 text-[var(--game-muted)]">This list reads the Firestore users collection. Deleting an account in Firebase Authentication does not automatically delete its Firestore profile, so remove the matching users/{'{uid}'} profile in Firestore to remove a deleted test account from these totals. Auth-only registration counts require a trusted backend.</p><label className="mt-3 block text-xs text-[var(--game-muted)]">Search participants<input value={search} onChange={event => { setSearch(event.target.value); setParticipantPage(1); }} className="mt-1 min-h-10 w-full max-w-sm border border-[var(--game-border)] bg-[var(--game-page)] px-3 text-sm text-[var(--game-text)]" /></label><table className="mt-4 w-full min-w-[900px] text-left text-sm"><thead className="text-xs text-[var(--game-muted)]"><tr>{['Learner ID', 'Display name', 'Tier', 'Pre-test', 'Post-test', 'Outcome', 'Mission attempts', 'Last recorded learning activity'].map(label => <th key={label} className="border-b border-[var(--game-border)] p-2">{label}</th>)}</tr></thead><tbody>{visibleParticipantRows.map(row => <tr key={row.id}><th className="border-b border-[var(--game-border)] p-2">{row.id}</th><td className="border-b border-[var(--game-border)] p-2">{row.name}</td><td className="border-b border-[var(--game-border)] p-2">{row.tier}</td><td className="border-b border-[var(--game-border)] p-2">{row.preScore}</td><td className="border-b border-[var(--game-border)] p-2">{row.postScore}</td><td className="border-b border-[var(--game-border)] p-2">{row.status}</td><td className="border-b border-[var(--game-border)] p-2">{row.missionCount}</td><td className="border-b border-[var(--game-border)] p-2">{row.lastActivity ? new Date(row.lastActivity).toLocaleString() : 'No recorded activity'}</td></tr>)}</tbody></table><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[var(--game-muted)]">Showing {firstVisibleParticipant}–{lastVisibleParticipant} of {filteredRows.length} matching profiles. Exact Firebase Auth registration totals and login activity are not available through the current client data.</p><nav aria-label="Participant pages" className="flex items-center gap-2"><button type="button" aria-label="Previous participant page" onClick={() => setParticipantPage(Math.max(1, currentParticipantPage - 1))} disabled={currentParticipantPage <= 1} className="inline-flex min-h-9 items-center gap-1 border border-[var(--game-border)] px-3 text-xs font-bold text-[var(--game-text)] disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={14} />Previous</button><span aria-current="page" className="min-w-16 text-center text-xs font-bold text-[var(--game-text)]">{currentParticipantPage} / {participantPageCount}</span><button type="button" aria-label="Next participant page" onClick={() => setParticipantPage(Math.min(participantPageCount, currentParticipantPage + 1))} disabled={currentParticipantPage >= participantPageCount} className="inline-flex min-h-9 items-center gap-1 border border-[var(--game-border)] px-3 text-xs font-bold text-[var(--game-text)] disabled:cursor-not-allowed disabled:opacity-50">Next<ChevronRight size={14} /></button></nav></div></section>}
      {activeTab === 'issues' && <section className="game-card space-y-4 p-5"><div><h2 className="text-lg font-black uppercase text-[var(--game-text)]">Player issue reports</h2><p className="mt-1 text-sm text-[var(--game-muted)]">Reports are visible only to enabled administrators. Do not treat user-submitted text as verified facts.</p></div>{issueReportsError && <p role="alert" className="border border-[var(--game-red)] p-3 text-sm text-[var(--game-red)]">{issueReportsError}</p>}{!issueReportsError && !issueReports.length && <p className="border border-[var(--game-border)] p-4 text-sm text-[var(--game-muted)]">No reports have been submitted.</p>}{issueReports.map(report => <article key={report.id} className="border border-[var(--game-border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[var(--game-text)]">{report.username || 'Operator'} <span className="ml-2 text-xs font-normal text-[var(--game-muted)]">{new Date(report.createdAt).toLocaleString()}</span></p><span className={`mt-2 inline-block border px-2 py-1 text-[10px] font-bold uppercase text-[var(--game-text)] ${report.status === 'open' ? 'border-amber-700' : 'border-green-700'}`}>{report.status}</span></div><button type="button" disabled={updatingReportId === report.id} onClick={() => void updateReportStatus(report)} className="min-h-9 border border-[var(--game-border)] px-3 text-xs font-bold text-[var(--game-text)] disabled:opacity-50">{updatingReportId === report.id ? 'Saving…' : report.status === 'open' ? <><CheckCircle2 size={13} className="mr-1 inline" />Mark resolved</> : 'Reopen'}</button></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--game-text)]">{report.message}</p></article>)}</section>}
    </>}
    <footer className="flex items-center gap-2 text-xs text-[var(--game-muted)]"><ShieldCheck size={15} />Research view. Counts reflect saved Firebase profile and attempt records; user-submitted issue reports can be marked resolved.</footer>
  </div>;
}
