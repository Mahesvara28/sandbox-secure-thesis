# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Progression and motivation

Sandbox Secure includes optional XP, rank, badges, streaks, and mission report feedback to reinforce evidence-first investigation, calibrated reporting, and verification. These client-side rewards are motivational and can be modified by the player; they are not assessment evidence. Pre/post-test questions, scoring, and pass thresholds remain separate and unchanged. Interpret learning-gain results with awareness that gamification can influence learner motivation.

## Participant data and launch preparation

**Participant note:** This is a learning study and all terminal commands are simulated. Your progress and mission/test attempt data are saved to your account. Use a desktop or laptop browser if possible. If you see a loading error, check your internet connection and turn off ad blockers or privacy extensions for this site. Do not include personal information in your username.

**Profile personalization:** Participants may choose from five bundled preset avatars. Only the preset `avatarId` is saved; participant photos are not collected or stored.

### Gamification in the study

The game includes XP, ranks, badges, streaks, separate one-attempt daily Time Attack and Accuracy Trial challenges, an optional Time Attack leaderboard, and mission report cards. These features can affect motivation and therefore how pre/post-test gains should be interpreted. The pre-test and post-test screens contain no XP, rank, badge, streak, or leaderboard UI. XP and streak values are client-side and can be edited by a participant; do not use them as assessment evidence.

### Dashboard and learning gain

The dashboard prioritizes one Continue action. Rank/XP progress, streak, and mission count share a compact status strip. Progress, Badges, and the optional daily leaderboard appear as one-at-a-time tabs; the full achievement wall and assessment results are also available from Profile. Learning gain is labeled as first-attempt percentage-point change. Any best post-test score is labeled separately. Both views use `preTestFirstScore` / `preTestFirstTotal` and `firstFinalScore` / `firstFinalTotal` when present, falling back to existing saved score fields for older accounts. Saved scores and certification pass logic are not changed.

Both daily challenge cards are hidden before the learner has completed the current tier's missions and before any post-test has been taken. They become available after all current-tier missions are complete or a post-test has been taken. Each has its own once-per-day attempt; Time Attack scores appear in its independent leaderboard. Attempts remain identifiable through `dailyChallengeDate` and `dailyChallengeType` in mission telemetry.

### Research data export

For research summaries, use the standalone Python standard-library script `scripts/export_research_aggregates.py`. It reads each user's `missionAttempts` and `assessmentAttempts` subcollections plus saved score summaries with a Google Cloud access token. It writes grouped CSVs and participant-level CSV rows keyed only by a salted pseudonym: first pre/post scores and attempt counts, hints opened, wrong commands by step, wrong decisions, mission timing, and daily-challenge use. It never exports UIDs, names, or emails. The credential must belong to a researcher with Firestore read access; never place a service-account key, the pseudonym salt, or exported participant data in the repository.

In PowerShell, sign in to the Google Cloud CLI with an account that has read access to the Firebase project, then run:

```powershell
$env:GOOGLE_CLOUD_PROJECT = "sandbox-thesis"
$env:FIRESTORE_ACCESS_TOKEN = (gcloud auth print-access-token)
$env:RESEARCH_EXPORT_SALT = "replace-with-a-long-private-random-value"
py scripts/export_research_aggregates.py --output .\research-exports
Remove-Item Env:\FIRESTORE_ACCESS_TOKEN
Remove-Item Env:\RESEARCH_EXPORT_SALT
```

The script produces `mission-aggregates.csv` and `assessment-aggregates.csv` for group summaries, plus `participant-summaries.csv`, `participant-assessment-summaries.csv`, and `participant-mission-aggregates.csv`. The same private salt produces the same pseudonyms across exports; keep it outside the repository and separate from the CSVs. `research-exports/` and `service-account*.json` are git-ignored. Make a Firestore backup/export before the study starts and store research exports in an access-controlled location.

### Firebase rules to deploy

No Firestore rules file is checked into this repository; confirm and publish rules in Firebase Console or add reviewed rules to the deployment project before participant sessions. The examples below show the intended access pattern; review them against the Firebase project before publishing.

- `users/{uid}` and its `missionAttempts` and `assessmentAttempts` documents: allow reads and writes only when the signed-in user's UID equals `{uid}`. Missing progression fields and missing attempt subcollections are valid legacy accounts. If/when rules validate the optional `avatarId` field, require a short string from the app's preset allowlist.
- `dailyTimeAttackEntries`: allow reads only to signed-in users. For create/update, require the document ID to begin with the authenticated UID and a date suffix, the stored `uid` to equal the caller, string values for nickname/date/mission ID/title/completion time, a valid date string, and numeric `clearTimeSeconds` between 5 and 3600. `avatarId` is optional and, when present, must be one of `avatar-1` through `avatar-5`. Deny deletes. New IDs are UID-first; pre-existing date-first entries remain readable. Client-submitted times are not tamper-proof, even with these rules. The leaderboard shares the saved username and preset avatar ID with signed-in participants; it does not share email addresses.
- Firebase Storage is not used by this build, so Storage rules are not needed for the game.
- XP and streak are client-held values and can be edited. They are motivational only and must not be treated as study outcome or assessment evidence. Owner-only access prevents cross-user reads; it does not make a participant's own client-submitted values tamper-proof.

Example Firestore rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /{subcollection}/{documentId} {
        allow read, write: if request.auth != null && request.auth.uid == uid
          && subcollection in ['missionAttempts', 'assessmentAttempts'];
      }
    }

    match /dailyTimeAttackEntries/{entryId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null
        && entryId.matches('^' + request.auth.uid + '_[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        && request.resource.data.keys().hasAll([
          'uid', 'nickname', 'challengeDate', 'missionId', 'missionTitle',
          'clearTimeSeconds', 'completedAt'
        ])
        && request.resource.data.keys().hasOnly([
          'uid', 'nickname', 'challengeDate', 'missionId', 'missionTitle',
          'clearTimeSeconds', 'completedAt', 'avatarId'
        ])
        && (!('avatarId' in request.resource.data)
          || request.resource.data.avatarId in ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5'])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.nickname is string
        && request.resource.data.challengeDate is string
        && request.resource.data.challengeDate.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        && request.resource.data.missionId is string
        && request.resource.data.missionTitle is string
        && request.resource.data.clearTimeSeconds is int
        && request.resource.data.clearTimeSeconds >= 5
        && request.resource.data.clearTimeSeconds <= 3600
        && request.resource.data.completedAt is string;
      allow delete: if false;
    }
  }
}
```

These examples do not make participant-owned XP, streaks, or badges tamper-proof. They are client-editable motivational data, not assessment evidence. Daily challenge times are also client-submitted and are for presentation only.

New mission and assessment attempt records include an optional `contentVersion` field (`2026-10-launch-1`); older records without it remain valid.

### Before participants begin

Make a Firestore backup first. Test with a fresh account and an older account on desktop and phone; verify loading with ad blockers/privacy extensions enabled and disabled. Run one full flow (pre-test, one mission, post-test), reload, and confirm progress and attempt records persisted. The welcome orientation and Dashboard state that this is a learning study, commands are simulated, and progress/attempt data are saved. The interface tour describes the current status strip, Continue action, More tabs, and How to Play location.
