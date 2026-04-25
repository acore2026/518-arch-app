## ADDED Requirements

### Requirement: Mandatory Category Selection
The Direct Intent Console SHALL display a mandatory choice for the user to select an intent category: "Experience" or "Compute".

#### Scenario: Selection before submission
- **WHEN** the user navigates to the Direct Intent Console
- **THEN** they SHALL see two distinct options for Category Selection: Experience and Compute.

#### Scenario: Blocked submission without selection
- **WHEN** the user types an intent but has not selected a category
- **THEN** the "Send Intent" button SHALL be disabled.

### Requirement: Category-Aware Intent Submission
The system SHALL include the user-selected category in the intent payload when submitting to the (stubbed) core network.

#### Scenario: Successful categorized submission
- **WHEN** the user selects "Experience", enters text, and clicks "Send Intent"
- **THEN** the intent SHALL be processed and displayed in the transcript with the "Experience" classification.
