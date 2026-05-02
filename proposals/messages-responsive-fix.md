# Fix: /messages Page — Duplicate Nav Bars & Broken Responsive Switch

## Root Cause

**The `/messages` page has two layout problems:**

1. **Two navigation elements visible simultaneously:**
   - `PageLayout` renders `LeftSidebar` + `AppHeader` in the shell
   - The `/messages` page body itself contains a `<aside>` (conversation list) that acts as a second sidebar within the content area
   - Result: two nav-like elements visible at once

2. **No responsive switching:**
   - `LeftSidebar` uses JavaScript (`window.innerWidth < 1024`) to toggle between collapsed (80px) and expanded (256px), but **never hides itself**
   - There's no `BottomTabBar` component — the sidebar always shows regardless of viewport
   - No CSS breakpoint-based hiding (`hidden lg:flex`)
   - Desktop should show `LeftSidebar` (full) + no bottom bar; Mobile should hide `LeftSidebar` + show `BottomTabBar`

**Comparison — `/dashboard` and `/friends`:** Both use the same `PageLayout` pattern, so they have the **same problem** — they all show the sidebar at all breakpoints.

## Fix Plan

### Step 1: Fix `LeftSidebar.tsx` — Add responsive CSS classes

On mobile (`<1024px`), the sidebar should be **hidden** via CSS, not just visually collapsed:

```tsx
// Change the sidebar element from:
<aside className={cn("fixed left-0 top-0 z-40 h-full ...")}
// To:
<aside className={cn("fixed left-0 top-0 z-40 h-full hidden lg:block ...")}
```

### Step 2: Add `BottomTabBar` component and integrate into `PageLayout`

- Create `src/components/layout/BottomTabBar.tsx` with 5 tabs: Home, Friends, Messages, Notifications, Profile
- Add responsive visibility: `block lg:hidden fixed bottom-0`
- Integrate into `PageLayout.tsx` alongside `LeftSidebar`

### Step 3: Fix `PageLayout.tsx` — conditionally render nav elements

```tsx
// Desktop (≥1024px): show LeftSidebar only
// Mobile (<1024px): show BottomTabBar only
```

### Step 4: Update `/messages` page

Remove the redundant `<aside>` conversation list from inside the page content — it should only show within the responsive context:
- Desktop: the conversation list `<aside>` is fine as part of the master-detail layout
- Mobile: conversation list should replace the content area, not coexist with the shell sidebar

## Files to Modify

| File | Change |
|------|--------|
| `src/components/left-sidebar.tsx` | Add `hidden lg:block` to the `<aside>` so it only shows on desktop |
| `src/components/page-layout.tsx` | Import and render `BottomTabBar` (mobile-only) alongside `LeftSidebar` |
| `src/components/layout/BottomTabBar.tsx` | **New file** — bottom tab bar with 5 tabs |
| `src/app/messages/page.tsx` | Add responsive classes to the conversation list `<aside>` — hide on mobile, show on desktop |
| `src/app/dashboard/page.tsx` | (No changes needed — will inherit from PageLayout fix) |
| `src/app/friends/page.tsx` | (No changes needed — will inherit from PageLayout fix) |

## Summary

- **Root cause:** `LeftSidebar` never hides on mobile (just collapses), and there's no `BottomTabBar`. The `/messages` page also has a second sidebar-like `<aside>` in its content.
- **Fix:** Make `LeftSidebar` desktop-only (`hidden lg:block`), add `BottomTabBar` for mobile, and scope the messages page's internal `<aside>` to desktop only.