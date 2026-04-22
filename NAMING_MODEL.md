# App Naming Model

This file defines the canonical language for the app. Use these names in code discussions, UI reviews, demo scripts, issues, and future documentation.

## Product-Level Names

- **App**: `IntentLink`
  Use this as the overall product/project name when referring to the Android app or the shared SPA.
- **Agent Brand**: `NETAGENT`
  Use this for the in-app network-aware assistant shown inside Direct Intent.

## Routes

- **App Route**: `/`
  The end-user experience. This is the main app surface on web and Android.
- **Admin Route**: `/admin`
  The presenter / operator control page.

## Primary Experiences

- **Streaming**: the video demo experience branded in-app as `StreamFlex`
- **Gaming**: the cloud gaming demo experience branded in-app as `CloudPlay`
- **Direct Intent**: the chat-style intent experience powered by `NETAGENT`

Use **experience** as the umbrella term, not “tab” or “mode”, unless you are specifically describing the UI switcher.

## Direct Intent Vocabulary

- **Transcript**: the scrollable message history
- **Composer**: the bottom input bar
- **Intent Message**: a single chat bubble in the transcript
- **Action Card**: the embedded decision card shown inside a network reply
- **Compute Available Card**: the specific action card for game-launch requests
- **Primary CTA**: `Deduct & Launch`

Preferred flow wording:
- User submits a **game-launch intent**
- `NETAGENT` returns a **compute-available response**
- User confirms the **action card**
- The app performs a **Moonlight handoff**

## Presenter / Control Vocabulary

- **Presenter Controls**: the full control page at `/admin`
- **Mobile Quick Controls**: the floating phone-friendly bottom sheet on `/`
- **Quick Presenter Panel**: the visible title inside that mobile sheet

Use **mobile quick controls** for the phone sheet. Do not call it the admin page.

## Network and Upgrade Terms

- **Network Tier**: `5G`, `Degraded`, or `6G`
- **Network Degradation**: the simulated congestion event
- **6G Boost**: the streaming upgrade path
- **6G Edge Boost**: the gaming upgrade path
- **Moonlight Handoff**: launching the external Moonlight Android app

## Terms to Avoid

- Avoid `phone shell`, `container app`, or `fake phone UI` for the current `/` experience.
- Avoid calling Direct Intent a `chatbot`; use `NETAGENT` or `Direct Intent`.
- Avoid `backend integration` for the current logic; use `stubbed flow` or `stubbed orchestration`.
