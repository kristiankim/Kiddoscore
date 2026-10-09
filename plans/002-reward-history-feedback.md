# 002 — Reward history feedback

- **Status**: DONE
- **Source baseline**: 51e2406
- **Created**: 2026-10-06
- **Severity**: LOW
- **Intent**: Help a parent locate a newly redeemed reward after confirmation.

## Scope and implementation

Animate only the exact newly saved redemption in Recent redemptions. A pointer-confirmed redemption fades from opacity 0 to 1 and lifts from translateY(4px) to 0 over 180ms, using the existing `--ease-out` token. Start after Base UI reports the confirmation dialog's exit complete, so the effect is visible rather than hidden behind the dialog.

`redeemForKid` now returns the saved redemption. This additive return value identifies the result by its ID rather than by its label, timestamp, or position. The balance validation, writes, compensation and refresh flow remain unchanged. Stage the saved ID before loading refreshed rows, so the new row's first render is already hidden. Begin revealing it only after both refreshes succeed and the dialog exits.

Use a scoped CSS transition with `waiting` and `entering` phases on the exact saved row. While waiting, opacity is 0 and translateY is 4px; after dialog exit, transition to opacity 1 and translateY 0. Clear the marker when the row's opacity transition ends. Switching children, refreshing, opening another confirmation, or a failed refresh clears the marker immediately. React unmount naturally removes the row and its transition. No dependency, DOM ref map, animation handle or persistent fill is needed.

Keyboard/assistive confirmation (`click.detail === 0`) queues no animation. For `prefers-reduced-motion: reduce`, animate only opacity over 60ms. Initial loading, existing rows, child switching, cancellations, failed saves and undo remain immediate. Do not animate list reordering, layout dimensions, counters or available reward cards.

Changed application files:

- `app/_components/RewardList.tsx`
- `app/globals.css`
- `app/_lib/rewards.ts`
- `__tests__/rewards.test.ts` (assert the saved result is returned)

## Verification — 2026-10-06

- TypeScript and all 41 tests pass. Whitespace checks pass.
- Isolated browser test app on port 3002, without environment files or access to the user's localhost:3000 storage. All redemptions used disposable demo records. No fixture code is included in the application changes.
- Concurrent DOM observations captured opacity 0 / translateY(4px), intermediate fade/lift values, and final opacity 1 / transform none. The dialog was already absent during row animation. Existing rows remained opacity 1 with no transform, including an older redemption with the same reward label.
- Enter-confirmed redemption displayed immediately: no row had a non-default opacity or transform in 100 observations. Child switching and restored history stayed still.
- A 1.5-second simulated save kept all action controls disabled. A double-click produced one redemption and one point deduction. A simulated failed save preserved history and balance, displayed the error, and required refresh before retry. Refresh recovery worked.
- Undo returned exactly the saved cost and removed the row without animating the remaining rows.
- Reduced-motion integration was initially checked by forcing the preference branch in the isolated copy; the correction below tests the replacement CSS rules. Direct browser preference emulation and physical touch testing were unavailable.
- At 320px, history rows fit without horizontal overflow and the child dropdown remains usable. The browser viewport was restored afterward.
- Test server and tab were closed. Main dev server remains on port 3000. This change has not been pushed or deployed.
- Browser proof: `/tmp/sparkquest-reward-history-fixed.png` (isolated test data).

## First-paint correction — 2026-10-06

The initial WAAPI implementation exposed a fully opaque row behind the closing dialog, then reset it to opacity 0. The original observations checked the entrance after dismissal and missed that earlier frame. A user reported the resulting flash.

Replace the WAAPI restart with the staged CSS transition described above. Verification now observes the entire sequence from before the save through completion, with a simulated 600ms balance refresh to make any early visible paint obvious:

- 300 concurrent DOM observations: the new row's first observed render was `waiting`, opacity 0, translateY(4px), while the dialog was open. Zero observations showed a visible new row before dismissal; opacity never decreased. After dismissal, it transitioned over 180ms to opacity 1, then cleared its marker. Existing rows stayed still.
- Keyboard confirmation: 260 observations showed no hidden or moving row and no entry marker.
- A simulated post-save balance-refresh failure cleared the staged marker and left the saved row fully visible; error and refresh-required behavior remained intact.
- Reduced-motion CSS enabled in the isolated copy: first paint was opacity 0 with no transform; opacity increased without any drop, using a 60ms opacity transition, then cleared its marker. No movement was observed. The production stylesheet keeps the actual preference media query.
- TypeScript, all 41 tests, and whitespace checks pass. No test fixtures were added to production source. User data on port 3000 was untouched.

## Motion review

| Before | After | Why |
| --- | --- | --- |
| Saved history row appears without feedback | Exact new row fades and lifts 4px after dialog exit, 180ms with existing ease-out | Helps locate the result of an occasional action |
| Row painted opaque before an animation reset it to zero | Saved ID staged before data render; CSS waiting-to-entering transition after exit | Guarantees one 0-to-1 entrance without a flash |
| No result-specific motion lifecycle | One staged saved ID; marker cleared on completion, failure or subsequent action | Prevents replay and hidden rows after an error |
| No motion modality distinction | Keyboard immediate; reduced motion uses 60ms opacity only | Preserves fast keyboard operation and removes movement when requested |

**Approve** — the corrected transition starts from the first paint's hidden state and never resets a visible row to zero. Motion affects only opacity and transform, stays under 300ms, and targets one successful result. Rapid repeated writes are guarded; a subsequent action clears motion. No layout animation, list stagger, new dependency, or persistent animation style was added. Preference-emulation and touch-device test limitations are recorded above.
