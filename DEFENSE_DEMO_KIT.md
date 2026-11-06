# Sandbox Secure defense demo kit

## Demo account and data

- Create a clearly labeled demo account and complete a small set of missions before the presentation.
- Keep demo results identifiable as demonstration data and exclude that account from thesis analysis.
- Use fictional names and reserved example IP addresses. Never add real participant details to the demo account.
- Confirm the account can sign in, resume a mission, view a debrief, open a certificate, and load the admin dashboard.

## Walkthrough order

1. Explain that the terminal is simulated and show the Academy's next mission.
2. Start a mission, use the objective and field guide, inspect evidence, and record a finding.
3. Show the completion debrief, including evidence, uncertainty, and response verification.
4. Show the certificate and its location under Profile → Certificates.
5. Open the profile skill-practice view and explain that it reflects recorded actions, not validated proficiency.
6. Sign in to the authorized admin account and show aggregate analytics and their data limitations.

## Presentation fallback

- Record a short screen capture of the walkthrough in the same browser and build used for the presentation.
- Keep a local copy of the recording and screenshots of the key screens available offline.
- Rehearse once on the presentation computer and confirm network access, display scaling, audio, and the correct production deployment.
- Do not use participant accounts or real collected records in the recording.

## Before presenting

- Refresh the admin dashboard and confirm it reports the expected demo-only state.
- Verify the deployed Firestore rules allow the authorized admin reads and deny participant cross-account reads and client writes.
- Confirm there are no open dialogs, stale browser sessions, or visible developer tools.
