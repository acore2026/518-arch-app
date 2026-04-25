## Why

The current "Direct Intent" tab allows users to submit natural-language intent without any structural guidance or boundary. To improve backend processing and user clarity, intents must be categorized into "experience" (e.g., bandwidth, lag) or "compute" (e.g., cloud gaming) categories before submission.

## What Changes

- Add a mandatory selection for "Intent Category" in the Direct Intent tab.
- Users must choose between "Experience" and "Compute" before they can send an intent.
- Update the intent submission logic to include the selected category.
- UI will prevent submission if no category is selected.

## Capabilities

### New Capabilities
- `categorized-intent-selection`: Enables users to classify their intent into predefined categories (Experience or Compute) to ensure structured input for the backend.

### Modified Capabilities
<!-- None -->

## Impact

- `App.tsx`: Main UI logic for the Intent tab and state management for category selection.
- `IntentMessage` type: May need update to store the user-selected category in the message history.
- `submitIntent` function: Needs to handle the new category parameter.
