## 1. State Management

- [x] 1.1 Add `intentCategory` state to `App` component (`'experience' | 'compute' | null`)
- [x] 1.2 Update `resetNetwork` and `handleExperienceChange` to reset `intentCategory` to `null`
- [x] 1.3 Update `submitIntent` signature to optionally accept a category, or use the state directly

## 2. UI Implementation

- [x] 2.1 Create the category selector UI (Experience / Compute buttons) above the text area
- [x] 2.2 Apply conditional styling to highlight the selected category
- [x] 2.3 Disable the "Send Intent" button if `intentCategory` is `null`
- [x] 2.4 Update the "Send Intent" button's `onClick` to pass the selected category (if needed)

## 3. Logic & Transcript

- [x] 3.1 Update `submitIntent` to use the selected category for the "user intent" message
- [x] 3.2 Ensure the core network response also reflects or acknowledges the selected category (optional/visual)

## 4. Verification

- [x] 4.1 Verify manual selection and submission in the browser
- [x] 4.2 Update `video-check.spec.ts` to include a category selection step in the "direct intent" test
- [x] 4.3 Ensure `npm run build` succeeds
