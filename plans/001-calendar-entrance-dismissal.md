# 001 — Add calendar entrance and dismissal transitions

- **Status**: DONE
- **Commit**: cffbc20
- **Created**: 2026-10-06
- **Severity**: LOW
- **Category**: Missed opportunities; interruptibility; accessibility
- **Estimated scope**: 3 application files, approximately 80–120 changed lines
- **Workspace**: /Users/kristian/Documents/01 Projects/Sparkquest
- **Dependencies**: None; use the installed @base-ui/react@1.3.0.
- **Intent**: Prevent the occasional calendar dialog from appearing and disappearing abruptly. Do not add decoration or slow keyboard use.

## Problem

In /Users/kristian/Documents/01 Projects/Sparkquest/app/_components/CalendarModal.tsx:41, closing removes the DOM immediately:

```tsx
if (!isOpen) return null;
```

The overlay and panel at lines 94–102 have no entrance or exit motion:

```tsx
return (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    onClick={e => e.target === e.currentTarget && onClose()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="calendar-title"
  >
    <div ref={trapRef} className="card max-w-sm w-full p-4 max-h-[90dvh] overflow-y-auto">
```

In /Users/kristian/Documents/01 Projects/Sparkquest/app/_components/TaskList.tsx:380, focus is manually restored on the next frame:

```tsx
<CalendarModal
  isOpen={showCalendar}
  onClose={() => {
    setShowCalendar(false);
    requestAnimationFrame(() => calendarTrigger.current?.focus());
  }}
  onDateSelect={setSelectedDate}
  selectedDate={selectedDate}
/>
```

Simply delaying unmount would leave custom focus trapping, modal semantics and focus restoration competing during exit. Use the existing dialog primitive's presence and focus lifecycle instead.

## Target

| Interaction | Panel | Backdrop |
| --- | --- | --- |
| Mouse/touch entrance | opacity 0 → 1; scale 0.97 → 1; 200ms | opacity 0 → 1; 200ms |
| Mouse/touch dismissal | opacity 1 → 0; scale 1 → 0.97; 150ms | opacity 1 → 0; 150ms |
| Reduced motion, mouse/touch | opacity only; 60ms both directions | opacity only; 60ms |
| Keyboard or assistive activation | Immediate; no transition | Immediate; no transition |

All transitions use **cubic-bezier(0.23, 1, 0.32, 1)**, the exact strong ease-out from the installed improve-animations/AUDIT.md. This defines a reusable --ease-out token; it does not change the task cards' existing cubic-bezier(0.22, 1, 0.36, 1).

Modal origin stays centered. Never scale from the Calendar button, use bounce, slide the panel, animate calendar cells, or animate month navigation.

## Repo conventions to follow

- Source component: /Users/kristian/Documents/01 Projects/Sparkquest/app/_components/CalendarModal.tsx.
- Caller: /Users/kristian/Documents/01 Projects/Sparkquest/app/_components/TaskList.tsx.
- Styles: /Users/kristian/Documents/01 Projects/Sparkquest/app/globals.css.
- /Users/kristian/Documents/01 Projects/Sparkquest/components/ui/dialog.tsx:1 already imports `Dialog as DialogPrimitive` from `@base-ui/react/dialog`. Reuse that installed primitive directly inside CalendarModal to isolate its styling. Do not change the shared dialog's existing animation classes.
- The installed DialogRoot supports controlled `open`, `onOpenChange`, and completion-aware presence. DialogPopup supports `initialFocus` and `finalFocus` ref objects. Backdrop and Popup expose `data-open`, `data-closed`, `data-starting-style`, and `data-ending-style`. These APIs were verified in node_modules/@base-ui/react/dialog/*/*.d.ts.
- Keep the current calendar panel background, border, typography, 384px maximum width, 16px padding, 90dvh maximum height, and scroll behavior.
- The global reduced-motion rules in globals.css:423 and :466 set transition duration to 0.01ms with !important. Add a later, calendar-specific reduced-motion rule to allow only the 60ms fade; leave other components unchanged.
- The current test runner is Vitest with a Node environment; do not install a DOM test framework solely for this change.

## Steps

1. **Track interaction modality in TaskList.tsx.**
   Add `calendarMotion` state typed `"pointer" | "keyboard"`, initially `"keyboard"`. In the existing Calendar button's onClick, set it to `event.detail === 0 ? "keyboard" : "pointer"` before setting showCalendar true. Zero-detail activation includes keyboard and assistive clicks; do not infer touch capability from viewport width.

2. **Extend CalendarModal's props.**
   Add `motion: "pointer" | "keyboard"` and `returnFocusRef: RefObject<HTMLButtonElement>`. Change `onClose` to accept the dismissal modality. Pass calendarMotion and calendarTrigger from TaskList. Its onClose callback sets the supplied modality and then showCalendar false. Remove the caller's manual requestAnimationFrame focus restoration: the popup's finalFocus now owns it.

3. **Replace only the custom modal shell.**
   Import `Dialog as DialogPrimitive` from `@base-ui/react/dialog`. Keep Root rendered even when isOpen is false; remove the early return. Structure the shell as Root → Portal → Backdrop and Popup. Root is controlled with `open={isOpen}` and `modal={true}`. Use Base UI's default pointer dismissal; no actionsRef, keepMounted, custom timer, keyframes, or second presence system.

   Popup gets `className="calendar-panel"`, `data-motion={motion}`, `initialFocus={closeButtonRef}`, and `finalFocus={returnFocusRef}`. Backdrop gets `className="calendar-backdrop"` and the same data-motion. Use DialogPrimitive.Title for the existing Select Date heading and preserve its id and styling. Use DialogPrimitive.Close for the top-right Close calendar button, retaining closeButtonRef, its label and hit area.

   Remove CalendarModal's useFocusTrap import/call, manual close-button focus call, and document Escape listener. Base UI now owns those responsibilities. Retain the existing effect that initializes currentMonth from selectedDate when opened, without depending on the onClose callback.

4. **Preserve immediate actions and classify every dismissal.**
   Root onOpenChange calls onClose only when the requested open value is false. Classify an event as keyboard if it is a keydown/keyup event or a click with detail 0; otherwise pointer. Base UI eventDetails.event contains the native event. Escape must force keyboard modality even during a pointer entrance or dismissal.

   Date selection, Today, and the bottom Close button must pass `event.detail === 0 ? "keyboard" : "pointer"` to onClose. Pass the click event into handleDateClick as necessary. Guard date selection and Today with `if (!isOpen) return;` so the exiting popup cannot select another date; retain the future-date guard. Call onDateSelect immediately before requesting close. Never defer date selection until animation completion, change future-date validation, or allow duplicate close side effects.

5. **Append scoped transition styles to globals.css.**
   Add --ease-out once to the existing :root declaration if it is still absent, using exactly cubic-bezier(0.23, 1, 0.32, 1). Add these rules after the existing blanket reduced-motion rules:

```css
.calendar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgb(0 0 0 / 50%);
  opacity: 1;
  transition: opacity 200ms var(--ease-out);
}
.calendar-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 50;
  width: calc(100% - 32px);
  max-width: 384px;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid var(--color-gray-100);
  border-radius: 16px;
  background: hsl(var(--bg));
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transform-origin: center;
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.calendar-backdrop[data-starting-style],
.calendar-backdrop[data-ending-style] { opacity: 0; }
.calendar-panel[data-starting-style],
.calendar-panel[data-ending-style] {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.97);
}
.calendar-backdrop[data-closed],
.calendar-panel[data-closed] { transition-duration: 150ms; }

@media (prefers-reduced-motion: reduce) {
  .calendar-backdrop,
  .calendar-panel {
    transition-property: opacity;
    transition-duration: 60ms !important;
  }
  .calendar-panel,
  .calendar-panel[data-starting-style],
  .calendar-panel[data-ending-style] {
    transform: translate(-50%, -50%) scale(1);
  }
}
/* Keep this after the reduced-motion exception. */
.calendar-backdrop[data-motion="keyboard"],
.calendar-panel[data-motion="keyboard"] { transition: none !important; }
```

   Do not retain the old .card transition-all class on the new popup. Position, width and height are static; only opacity and transform transition. No hover motion is added, so no hover media gate is needed.

6. **Verify the lifecycle, not just appearance.**
   Test the cases below in the existing browser. Inspect the exiting popup's computed transition duration and Base UI's ending-style attribute to confirm the DOM survives pointer dismissal but disappears when its transition completes. Verify pointer clicks cannot activate exiting date buttons and focus never remains on an unmounted element. If this installed Base UI release fails a lifecycle criterion, report it before introducing custom presence handling.

## Boundaries

- Do not change components/ui/dialog.tsx, app/_lib/useFocusTrap.ts, rewards, parent settings, login, database logic, task cards, or their motion.
- Only change the three application files named above. Browser verification artifacts may be saved separately; do not add dependencies or fixture routes.
- Preserve all calendar dates, local-noon date parsing, disabled future dates, labels, selected/today styles, 44px hit areas, date-selection behavior, and keyboard order.
- Do not animate calendar month changes, dates, task lists, counters, routes, or focus rings.
- Do not deploy or push as part of implementation unless the user authorizes it.
- If the cited code or installed Base UI APIs have drifted, stop and report the specific mismatch instead of improvising.

## Verification

**Mechanical**
- From /Users/kristian/Documents/01 Projects/Sparkquest run `npx tsc --noEmit`, `npm test -- --run`, and `git diff --check`. Expect no type errors, all existing tests passing (41 at the stamped commit), and no whitespace errors.
- Check that only transform and opacity transition; computed durations must be 200ms on pointer entrance, 150ms on pointer exit, 60ms with reduced motion, and 0s for keyboard activation.
- Confirm no useFocusTrap/document Escape listener remains in CalendarModal and no caller requestAnimationFrame restores calendar focus.

**Feel check**
- Open with mouse and touch. The panel settles from scale 0.97 without bounce or displacement; all controls are immediately usable.
- Close using top-right X, bottom Close, backdrop, Today, and a valid date. Date changes take effect immediately; dismissals never flash or jump.
- In DevTools' Animations panel, use 10% playback to inspect entry/exit. If CSS transitions are not exposed there, capture frames at a temporary slowed playback rate and restore the normal rate afterward. Do not slow production durations in source.
- Close during entrance and reopen during dismissal repeatedly. Transitions should retarget from their current rendered state; no restart flash, duplicate backdrop, stale close callback, or lingering overlay.
- Open with Enter or Space. Dialog is immediately visible and Close calendar is focused. Shift+Tab wraps to bottom Close; Tab wraps forward. Escape immediately dismisses and restores Calendar-button focus, including when used mid-pointer-animation.
- Check that pointer dismissal restores focus to Calendar; once visually dismissed, the page is unlocked and keyboard focus moves normally. Test rapid reopen and navigation/unmount during a transition.
- Emulate prefers-reduced-motion: only a gentle 60ms fade remains; no scale. Then open/dismiss with keyboard: immediate despite reduced-motion CSS.
- Verify 320px-wide phone, tablet, desktop, and short-height viewports: panel stays centered, fits the screen and scrolls; it does not animate dimensions.
- Do not submit real data or modify completion history while testing calendar navigation.

**Done when**
- Every dismissal path works once; pointer entry/exit and interruption have no visual jump.
- Keyboard and assistive activation stay immediate, focus trapping/restoration remain correct, and background interaction stays blocked while the modal is active.
- Reduced motion removes movement and preserves the scoped fade.
- Mechanical checks pass, with no changes outside the stated scope.

## Implementation verification — 2026-10-06

- Changed only CalendarModal.tsx, TaskList.tsx and globals.css, plus these plan records. No new dependencies.
- TypeScript, all 41 existing tests and whitespace checks pass.
- Browser: pointer entrance computes 200ms with opacity/transform and the specified ease-out. Concurrent DOM observations captured the ending-style state at 150ms and its fading opacity; the panel then unmounted and focus returned to Calendar.
- Enter/Space opening computes 0s. Close calendar receives initial focus, Shift+Tab/Tab wrap correctly, and Escape dismisses immediately with focus restored. Escape interrupting a pointer entrance also left no overlay.
- Top-right Close, bottom Close, backdrop, a past date and Today all dismiss correctly. Future dates remain disabled. Three consecutive reopen cycles each showed exactly one panel and left zero panels after closing.
- 320px-wide and short-height views fit and scroll. Calendar navigation did not change stored tasks, points or completions.
- Reduced-motion styles were tested in a temporary isolated copy with the reduced-motion media blocks enabled: pointer mode computed opacity only at 60ms with scale 1; keyboard mode still computed 0s. Direct browser preference emulation and physical touch-device testing were unavailable; the test copy and server were separate from the main app, and the temporary server was stopped.
- Application source remains local; nothing was pushed or deployed for this change.

## Motion review

| Before | After | Why |
| --- | --- | --- |
| Calendar immediately mounted/unmounted | Base UI presence with centered scale 0.97 and opacity, 200ms in / 150ms out | Bridges an occasional state change and retains the panel through exit |
| Custom focus trap and next-frame focus restoration | Base UI initialFocus/finalFocus refs | Keeps focus and presence managed by the same dialog lifecycle |
| No calendar-specific reduced-motion behavior | Scoped 60ms opacity-only fade; 0s for keyboard | Removes movement while preserving immediate keyboard interaction |

**Approve** — only opacity and transform transition, timing stays under 300ms, transitions are interruptible, and keyboard/reduced-motion handling is scoped to the calendar. The physical touch-device and direct preference-emulation limits are stated above.
