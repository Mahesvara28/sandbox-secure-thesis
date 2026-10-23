# Research data and assessment notes

## Current collection

- Use the Google Forms questionnaire for participant feedback. The game does not show an in-game evaluation survey.
- Mission telemetry is operational learning data: one document per attempt under `users/{uid}/missionAttempts`. It records the mission and concept, outcome, elapsed time, time per objective, hint levels opened, incorrect commands by objective, and incorrect decision count. It does not store command text, email, or a conclusion about a participant.
- Assessment attempts are stored under `users/{uid}/assessmentAttempts`. The existing `users/{uid}.scores` fields remain in place. New first-attempt score and attempt-count fields are additive; the existing final score remains the best score.
- The profile export downloads per-mission and per-assessment summaries plus detailed attempt rows for the signed-in account. It cannot export other learners’ records from a browser client.

## Firestore rules check

There is no Firestore rules file or Firebase deployment configuration in this repository, so the deployed rules could not be audited here. The new subcollections need rules that allow an authenticated user to read and create only their own attempt documents, while preventing client edits or deletion. For example, add the following matches inside the existing `match /databases/{database}/documents` block, while retaining the project’s existing `users/{uid}` rules:

```text
match /users/{uid}/missionAttempts/{attemptId} {
  allow read, create: if request.auth != null && request.auth.uid == uid;
  allow update, delete: if false;
}

match /users/{uid}/assessmentAttempts/{attemptId} {
  allow read, create: if request.auth != null && request.auth.uid == uid;
  allow update, delete: if false;
}
```

For a researcher-wide export across students, use a trusted server or Firebase Admin SDK endpoint protected for authorized researchers. Do not add a client query that exposes every `users` document.

## Retake interpretation

The post-test currently reuses its fixed question set. `scores.{tier}.finalScore` continues to represent the best score, and `firstFinalScore` preserves the first observed post-test result. Each submission is also appended to `assessmentAttempts`. Because learners may see answer explanations after completion, later scores can reflect answer exposure and practice; do not interpret a retake gain as independent learning evidence. A future study should use equivalent rotated forms or report first-attempt outcomes separately. The 70% threshold is unchanged.

The pre-test also retains its current score field for compatibility, adds first-attempt fields and an attempt count, and appends each submission to `assessmentAttempts`. For users who already have scores from before attempt logging was added, the original first attempt cannot be reconstructed; the current saved score is used as the earliest available baseline.
