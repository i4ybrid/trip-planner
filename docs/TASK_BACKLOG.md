# Task Backlog - Notification & Calendar System

## Sprint: Notification & Calendar Export

---

## User Stories

### Calendar Export
- [ ] **US-001**: As a trip member, I want to export trip events to iCal so I can view them in my calendar app
- [ ] **US-002**: As a trip member, I want to add trip events to Google Calendar with one click
- [ ] **US-003**: As a trip member, I want to add trip events to Outlook Calendar with one click
- [ ] **US-004**: As a trip member, I want to export individual activities to calendar

### Notification System
- [ ] **US-005**: As a user, I want to receive in-app notifications so I stay updated
- [ ] **US-006**: As a user, I want to see a notification bell with unread count so I know when I have new notifications
- [ ] **US-007**: As a user, I want to click a notification to go directly to the relevant content
- [ ] **US-008**: As a user, I want to dismiss notifications so I can clear my notification list
- [ ] **US-009**: As a user, I want to mark all notifications as read
- [ ] **US-010**: As a user, I want to configure which notifications I receive via email
- [ ] **US-011**: As a user, I want to configure which notifications I receive via push
- [ ] **US-012**: As a user, I want to set quiet hours so I don't receive notifications at night

---

## Tasks by Feature

### Calendar Export

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| CAL-001 | Create calendar service with iCal generation | 2h | HIGH |
| CAL-002 | Create calendar API endpoints | 1h | HIGH |
| CAL-003 | Generate Google Calendar URL scheme | 1h | HIGH |
| CAL-004 | Generate Outlook Calendar URL scheme | 1h | HIGH |
| CAL-005 | Create calendar export dropdown component | 2h | HIGH |
| CAL-006 | Add calendar export button to trip overview | 1h | HIGH |
| CAL-007 | Add calendar icon to activity items | 1h | MEDIUM |
| CAL-008 | Write E2E tests for calendar export | 2h | HIGH |

### Notification Backend

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| NOT-001 | Update Prisma schema for notifications | 1h | HIGH |
| NOT-002 | Enhance notification service with actions/links | 2h | HIGH |
| NOT-003 | Add notification preferences endpoints | 2h | HIGH |
| NOT-004 | Add push subscription endpoints | 2h | MEDIUM |
| NOT-005 | Create notification triggers on relevant events | 3h | HIGH |

### Notification Frontend

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| NOT-006 | Create notification bell component | 2h | HIGH |
| NOT-007 | Create notification panel component | 3h | HIGH |
| NOT-008 | Create notification list page | 2h | HIGH |
| NOT-009 | Create notification item component | 1h | HIGH |
| NOT-010 | Create notification settings page | 3h | HIGH |
| NOT-011 | Integrate notification bell into header | 1h | HIGH |
| NOT-012 | Implement mark as read/dismiss actions | 2h | HIGH |
| NOT-013 | Write E2E tests for notifications | 3h | HIGH |

### Push Notifications (Phase 2)

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| PUSH-001 | Set up service worker for push | 2h | MEDIUM |
| PUSH-002 | Implement WebPush subscription flow | 2h | MEDIUM |
| PUSH-003 | Create push notification payload handler | 2h | MEDIUM |
| PUSH-004 | Add VAPID keys configuration | 1h | MEDIUM |

### Email Notifications (Phase 2)

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| EMAIL-001 | Set up SendGrid integration | 2h | MEDIUM |
| EMAIL-002 | Create email templates | 4h | MEDIUM |
| EMAIL-003 | Implement email queue/job system | 2h | MEDIUM |
| EMAIL-004 | Add unsubscribe handling | 1h | MEDIUM |

---

## Total Estimates

| Phase | Tasks | Hours |
|-------|-------|-------|
| Calendar Export | 8 tasks | 11h |
| Notification Backend | 5 tasks | 10h |
| Notification Frontend | 8 tasks | 16h |
| Push (Phase 2) | 4 tasks | 7h |
| Email (Phase 2) | 4 tasks | 9h |
| **Total** | **29 tasks** | **53h** |

---

## Sprint Duration

- **Team**: 1 SE, 1 PM, 1 QA
- **Velocity**: ~8h/day
- **Sprint Length**: 1 week (5 days)
- **Capacity**: 40h SE, 8h QA

**Note**: Phase 2 (Push/Email) should be scheduled in a follow-up sprint.

---

## Dependencies

1. Calendar export depends on: Activity data model (already exists)
2. Notification system depends on: User auth (already exists)
3. Push notifications depend on: Service worker setup
4. Email depends on: SendGrid API keys

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google/Outlook URL schemes change | MEDIUM | Use documented stable APIs |
| Push notification permission fatigue | MEDIUM | Make opt-in, explain benefits |
| Email deliverability | LOW | Use SendGrid, proper SPF/DKIM |
| Notification overload | MEDIUM | Implement batching, quiet hours |

---

## Definition of Done

### Calendar Export
- [ ] iCal file downloads and imports into Apple Calendar
- [ ] Google Calendar link opens correctly
- [ ] Outlook Calendar link opens correctly
- [ ] E2E tests pass

### Notification System
- [ ] Bell shows unread count
- [ ] Clicking notification navigates to correct page
- [ ] Dismiss removes notification
- [ ] Settings page allows toggling preferences
- [ ] E2E tests pass

*Document Version: 1.0*
*Created: March 2026*
*Author: Project Manager*
