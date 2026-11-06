# Admin analytics setup and safe use

The app's admin screen checks `admins/{uid}` before loading analytics. Analytics and learner data are read-only; admins can change only issue-report status. The interface check is not the security boundary: Firestore Security Rules enforce access. The current rules are in `firestore.rules`; this repository has no Firebase CLI deployment configuration, so copy the reviewed rules into Firebase Console → Firestore Database → Rules and publish them there.

`firestore.rules` requires a verified Firebase Auth email for signed-in access. This matches the current email-verification flow in the app. Publish the reviewed rules in Firebase Console after changing them; pushing the website does not deploy Firestore rules.

## Enable one administrator

1. In Firebase Console, copy the administrator's Firebase Authentication UID.
2. In Firestore, create `admins/{that-uid}` with `{ "enabled": true }`.
3. Add equivalent permissions to your existing rules, preserving the current owner-only reads and writes. Have a second person review the complete rules before publishing.

The rules need to enforce all of these conditions:

- A signed-in user can read only their own `admins/{uid}` record, and nobody can create or modify admin records from the client.
- Only an authenticated UID with an existing enabled admin document can list user profiles or read any user's `missionAttempts` and `assessmentAttempts` subcollections.
- Participants retain the existing access they need to their own profile and attempt records.
- Admin analytics access is read-only. Admins must not update, create, or delete participant data through this feature. Issue-report admins may change only the report status and update timestamp.

Use the Rules Playground with at least these cases before publishing: owner can read their own profile; participant cannot list all users; participant cannot read another user's attempts; enabled admin can read profiles and attempts; disabled/missing admin cannot; admin client writes to participant records are denied; admin document writes from any client are denied. The screen will show a permission error until the deployed rules permit the requested reads.

## Current user records and deleted test accounts

The browser dashboard counts documents in Firestore's `users` collection. It cannot list or verify the Firebase Authentication user roster from the web SDK. Deleting a user in Authentication does not automatically delete `users/{uid}` or its subcollections, so an old profile can remain in the displayed count. To remove a test profile from dashboard analytics, delete its `users/{uid}` document in Firestore as well. Deleting a parent profile does not automatically delete its subcollections; remove those separately only when you intend to erase the associated attempt data. Do not remove real participant records just to adjust the dashboard number.

For an exact current Authentication account count, use a trusted server-side Firebase Admin SDK/Cloud Function that reconciles Auth users against Firestore profiles. Never expose Admin SDK credentials in the browser.

## Player issue reports

The app lets an authenticated, email-verified player submit a text report. Publish the `issueReports` rules in `firestore.rules` for submissions and the admin Issues tab to work. Only enabled admins can read or mark reports resolved. Reports are user-submitted text, not verified evidence; advise players not to include passwords or other sensitive data. Reports are retained in Firestore until removed through a trusted administrative process.

## What the dashboard reports

- Current Firestore user-profile document count (not an exact Firebase Auth account count; see cleanup note above).
- Paired first-attempt pre/post averages, pass counts, completion outcomes, median mission time, hints, command errors, abandons, and timeouts.
- A participant table showing display name and generated row IDs; it excludes email and raw UID. Row IDs are not stable research pseudonyms.

Question-level correctness is not recorded in current assessment attempt documents. Google Forms survey responses are also outside Firestore. Neither appears in this dashboard. Refresh manually: reading all user profiles and their attempt subcollections consumes Firestore reads proportional to the dataset size. For larger cohorts, move aggregation to a trusted server-side job and cache summary documents.

This dashboard is an operational research view, not a tamper-proof audit system. The browser client is not trusted to author participant telemetry.
