# Adding game content

## Current workflow

Mission scenarios and assessment questions are currently authored in TypeScript; teachers do not have an in-game content editor. To add or revise content today, a developer edits `src/data/gameData.ts`, reviews the change, builds the app, and deploys the updated version. This keeps mission behavior and accepted answers consistent, but it means content changes require a code/deployment workflow.

Search `src/data/gameData.ts` for `CONTENT EDITING GUIDE` to jump to the tutorial, bridge, and certification mission sections. Search `ASSESSMENT CONTENT EDITING GUIDE` for the pre/post-test question arrays.

### Editing a mission

1. Find the mission by its `title` or stable `id` (for example, `m2`).
2. Edit the scenario/briefing, learning goal, evidence, topology, and `steps` as needed.
3. In each step, check `cmd`, `target`, `alternates`, `requiredCommands`, and `decision.correctId` together. These define what the simulated terminal accepts and what counts as the correct decision; changing only the displayed hint may leave the expected answer unchanged.
4. Keep mission IDs stable. Existing progress and analytics refer to those IDs.
5. For a new mission, provide a unique ID and all required `Mission` fields. Add it to the correct exported mission array and confirm the intended screen uses that array.

### Editing assessment questions

Find the question in the appropriate tier's pre-test or post-test array. Review `question`, all `options`, `correctAnswer`, and `explanation` together. Do not reuse pre-test questions as post-test questions. Assessment content changes can affect study comparisons; record the content/version change and coordinate analysis by cohort.

## A teacher-facing workflow for future use

For a deployed school product, add a protected teacher authoring screen rather than asking teachers to edit TypeScript. A teacher could create a draft, preview it as a learner, submit it for review, and publish an approved version. Store authored content in a validated schema with explicit version IDs, keep existing attempts linked to the version students saw, and restrict publish permissions to approved teacher/admin accounts. Keep the current hardcoded missions as a fallback until that authoring workflow is built and tested.

Do not put Firebase Admin SDK credentials or unrestricted Firestore writes in the browser. Do not edit a published mission in place if the change would alter the expected answer for learners who already started it; publish a new content version instead.
