## Context

The "Direct Intent Console" currently features a simple text area for input. The user wants to enforce a choice between "Experience" and "Compute" categories to guide the backend processing. This requires a UI update to include a category selector and a state update to track the selection.

## Goals / Non-Goals

**Goals:**
- Implement a mandatory category selector (Experience/Compute) in the Intent tab.
- Prevent intent submission unless a category is selected.
- Pass the selected category to the (stubbed) backend processing logic.

**Non-Goals:**
- Implementing a real backend for category processing (stay within the stubbed flow).
- Changing the layout of other tabs (Streaming/Gaming).

## Decisions

- **UI Implementation**: Use a toggle-like segmented control (buttons) above the "Intent Payload" label. This fits the existing aesthetic of the "Quick prompts" and experience tabs.
- **State Management**: Add a new local state `intentCategory` (type: `'experience' | 'compute' | null`) to the `App` component.
- **Validation**: Disable the "Send Intent" button if `intentCategory` is `null`.
- **Display**: Show the selected category as the message "category" badge in the transcript (currently often 'unknown').

## Risks / Trade-offs

- [Risk] UI clutter in the mobile-sized console. → [Mitigation] Keep the selector compact and styled similarly to existing buttons to maintain visual consistency.
- [Risk] Forgetting to reset the category. → [Mitigation] Reset the category to `null` after a successful submission or when switching tabs.
