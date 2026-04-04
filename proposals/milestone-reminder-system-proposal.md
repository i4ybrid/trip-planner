# Milestone Reminder System — Updated Design

## Overview

Milestones are auto-generated at key trip lifecycle transitions. Each milestone has a `dueDate` and a `reminderAt` (= dueDate − 3 days). No on-demand email/SMS actions are triggered from milestones; reminder delivery is handled by the Payments tab via `reminderService`.

---

## Milestone Generation Triggers

### 1. Trip Creation (`createTrip()`)

**When:** `startDate` is provided at trip creation.

**Methods called:**
- `milestoneService.generateIdeaMilestones(tripId, startDate)`

**What it creates:**
| Milestone | Algorithm | isHard |
|---|---|---|
| `COMMITMENT_REQUEST` | `now + 0.30 × (startDate − now)` | false |
| `COMMITMENT_DEADLINE` | `now + 0.50 × (startDate − now)` | true |

Both are **idempotent** — only created if not already present for this trip.

---

### 2. Status → PLANNING or CONFIRMED (`changeTripStatus()`)

**When:** `newStatus === 'PLANNING'` or `newStatus === 'CONFIRMED'`.

**Methods called:**
- `milestoneService.generateFinalPaymentMilestone(tripId, startDate)` — idempotent

**What it creates:**
| Milestone | Algorithm | isHard |
|---|---|---|
| `FINAL_PAYMENT_DUE` | `now + 0.75 × (startDate − now)` | true |

---

### 3. Status → HAPPENING (`changeTripStatus()`)

**When:** `newStatus === 'HAPPENING'`.

**Methods called:**
- `milestoneService.generateSettlementMilestones(tripId, endDate)`

**What it creates:**
| Milestone | Algorithm | isHard |
|---|---|---|
| `SETTLEMENT_DUE` | `endDate + 1 day` | true |
| `SETTLEMENT_COMPLETE` | `endDate + 7 days` | false |

Both are **idempotent** — only created if not already present for this trip.

---

## Manual Fallback

`generateDefaultMilestonesFromToday()` is kept as-is. It uses a similar percentage-based algorithm but anchors to **today** instead of the trip's `startDate`, making it suitable for retroactive milestone generation on trips that skipped auto-creation.

---

## Algorithm (Percentage-Based Dates)

```
T_remaining_ms = startDate.getTime() − Date.now()

COMMITMENT_REQUEST   = now + T_remaining_ms × 0.30
COMMITMENT_DEADLINE  = now + T_remaining_ms × 0.50
FINAL_PAYMENT_DUE    = now + T_remaining_ms × 0.75
```

Reminder dates are always `dueDate − 3 days`.

---

## Idempotency

All auto-generation methods check for existing milestones of the same type before creating, ensuring no duplicate milestones even if the same status transition fires multiple times.
