# App Naming Model

This file defines the canonical language for the app. Use these names in code discussions, UI reviews, demo scripts, issues, and future documentation.

## Product-Level Names[](https://)

- **App**: `IntentLink`
  Use this as the overall product/project name when referring to the Android app or the shared SPA.
- **Agent Brand**: `NETAGENT`
  Use this for the in-app network-aware assistant shown inside Direct Intent.

## Routes

- **App Route**: `/`
  The main app surface on web and Android. This now includes the end-user experience and the live control panel.

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

- **Control Panel**: the in-app floating controls sheet opened from the `Controls` button
- **Controls Button**: the floating trigger that opens the Control Panel
- **System Agent Backend**: the configurable backend endpoint inside the Control Panel used by Direct Intent
- **Compute Node Host**: the configurable host inside the Control Panel used to arm Moonlight stream scenarios
- **Live Controls**: the small section label shown at the top of the Control Panel

Use **Control Panel** as the default term. Do not call it the admin page or presenter page.

## Network and Upgrade Terms

- **Network Tier**: `5G`, `Degraded`, or `6G`
- **Network Degradation**: the simulated congestion event
- **6G Boost**: the streaming upgrade path
- **6G Edge Boost**: the gaming upgrade path
- **Moonlight Handoff**: launching the external Moonlight Android app
- **Base Scenario**: the Compute Node scenario armed after the user taps `Fix`
- **Overload Scenario**: the Compute Node scenario armed before the Moonlight handoff

## Terms to Avoid

- Avoid `phone shell`, `container app`, or `fake phone UI` for the current `/` experience.
- Avoid calling Direct Intent a `chatbot`; use `NETAGENT` or `Direct Intent`.
- Avoid `admin route`, `/admin`, or `presenter page`; those no longer exist in the app.
- Avoid `backend integration` for the local demo path; use `stubbed flow`, `stubbed orchestration`, or `System Agent backend` when the endpoint is configured.
