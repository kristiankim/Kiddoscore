# UI scenario verification

Verified September 29, 2026 against the current Tasks, Rewards, Parent settings, and header implementation.

## Environment

Browser checks used a copy of the app at `/tmp/sparkquest-ui-qa`, served at localhost:3001. It uses the same page and component code with a fixture storage adapter and visible QA controls. Test data is isolated from localhost:3000 and the live site. The fixtures provide 0, 1, 2, 3, and 8 children, plus long names, unbroken names, long tasks, and long rewards. Save controls simulate normal writes, three-second writes, rejected writes, and a rejected second write after the balance has saved.

## Results

| Scenario | Tasks | Rewards | Parent settings |
| --- | --- | --- | --- |
| Zero children | Empty state and add-child action | Empty state and settings action | Empty list and add-child form |
| One child | Centered 720px column | Name displayed; no selector | One editable profile |
| Two children | Two desktop columns; one selected on phone | Two desktop tabs; mobile dropdown | Two profiles |
| Three children | Three desktop columns; one selected on phone | Three desktop tabs; mobile dropdown | Three profiles |
| Eight children | Three-column grid wraps into further rows | All eight desktop tabs available; mobile dropdown | Eight profiles |
| Long content | Names and task text wrap | Long tabs/reward titles wrap; mobile selector stays within width | Names, assignments, task and reward titles wrap |
| Narrow phone | No horizontal overflow at 320px for every fixture | No horizontal overflow at 320px for every fixture | No horizontal overflow at 320px for every fixture |

Desktop child-count checks were made at the browser's default viewport (approximately 1265px). Phone checks used a 320px viewport. Long-content parent checks cover all three settings tabs.

## Interaction checks

- Keyboard: Space toggles task checkboxes; Enter follows the main navigation; arrow keys plus Enter switch reward tabs; settings tabs and forms are usable by keyboard.
- Calendar: Enter opens it, initial focus lands on Close, Shift+Tab wraps to the final control, Escape closes it and returns focus to Calendar.
- Parent access: PIN input, submit, and route navigation work with keyboard controls.
- Reward confirmation: Enter opens it; Cancel receives initial focus; Escape closes it. After failure, focus returns to Refresh rewards when the original redeem button is disabled.
- Failed task second write: balance returns to the starting value, checkbox resets, error is shown, and task edits remain disabled until refresh. Reload confirms the unchanged stored balance.
- Slow task save: rapid double-click produces one completion and one points award; other task controls and Calendar are disabled while saving.
- Failed redemption second write: balance is restored, no redemption is recorded, confirmation displays the error, and refresh is required before retrying.
- Slow redemption: rapid double-click records one redemption and deducts the cost once.
- Failed undo: the balance is restored and the existing redemption remains in history.
- Failed parent add: the draft is retained, the error is displayed, edits are disabled, and Refresh settings remains usable.
- Slow parent add: rapid double-click adds one task; forms and row controls are disabled during saving.
- Invalid points: a zero-point task fails native form validation and is not added.
 
## Issues found and repaired

1. Task points could persist when the completion write failed. The task save now compensates by restoring the balance and requires refresh after an error. The same save logic is used for Clear today.
2. Nested completion state was mutated in place. Updates now retain an unchanged original snapshot.
3. Uncompleting a task after spending its points could make the balance negative. Balances now clamp to zero.
4. Long assignment labels expanded the nested fieldset on narrow phones. The fieldset and label content now allow shrinking and wrapping.
5. Reopening deliberately empty local lists could restore sample data. Seeding now distinguishes missing storage from saved empty arrays.
6. Failed parent saves allowed immediate retries. The UI now requires refresh before another edit.
7. Closing a failed reward dialog could lose focus when its trigger was disabled. Focus now moves to the refresh control, with the heading as a fallback.

## Automated checks

30 tests passed, including regressions for task save compensation, unchanged completion snapshots, previous-date protection, nonnegative balances, and empty household persistence. Type checking and the production build passed.

## Limits

The browser save-failure and latency checks use the isolated storage adapter. They do not establish Supabase authorization, live network behaviour, or simultaneous writes from multiple tabs/devices. Balance and completion/redemption persistence still use separate writes with compensation; they are not a database transaction.

## Task-add toast — October 6, 2026

- A new task's success feedback now uses Sonner instead of the inline success banner. It fires only after the write, settings reload, and balance refresh succeed. Other settings actions keep their existing feedback.
- One unconditional Toaster is mounted in the root layout outside the page content. It uses Geist, app surface/text/border tokens, and a close button. The layout remains a server component; the client save handler triggers the toast directly, with no notification effect or duplicate provider.
- Browser checks used a separate app copy on localhost:3003 with disposable data and temporary delayed/failed task-write fixtures. No test fixtures were added to application source, and localhost:3000 data was untouched.
- Pointer and Enter submissions added tasks and displayed one “Task added.” toast with an empty inline status region. With settled initial data, the form's document position remained exactly 345px before and after submission. Focus returned to the task-name input; native focus scrolling was excluded from the document-layout measurement.
- A one-second delayed save displayed Saving and disabled controls, with zero premature toasts. A double-click saved one task. A rejected save added no task or toast, retained the draft, and displayed the existing refresh-required error.
- At 320px, the toast occupied x=16 to x=289 with no page overflow. Alt+T focused the notification list; Enter on Close toast dismissed it. Sonner supplies polite live announcements and reduced-motion styles.
- TypeScript, all 41 existing tests, and whitespace checks pass. The React integration review found one root Toaster, event-handler notification dispatch, serializable layout props, and preserved pending/failure guards.
- Screenshot: `/tmp/sparkquest-task-added-toast.png`. The test tab/server were closed and the viewport restored. Changes remain local.

## Parent settings sliding selection — October 7, 2026

- Used the `animate` skill for subtle state indication in the Children / Tasks / Rewards control. Base UI's native Indicator supplies the selected tab's geometry; the shared Tabs wrapper now exposes this primitive. Other tab lists do not render it and retain their styling.
- One background box slides with a transform-only 160ms transition and the skill's `cubic-bezier(0.77, 0, 0.175, 1)` ease-in-out token. Equal-width columns avoid animated resizing; the label and panel selection update immediately. The indicator renders before hydration and does not animate its initial appearance.
- Native tab event details distinguish pointer activation from keyboard/assistive clicks. Enter and Space selection compute 0s; arrow keys still move focus without changing selection until activation. Reduced-motion CSS disables the spatial transition. Existing disabled/pending behavior is preserved.
- Browser observations captured intermediate horizontal positions while the new Rewards panel was already displayed. The transition computed 160ms with the specified easing. Retargeting toward Tasks during the observation sequence ended aligned with Tasks and retained exactly one indicator.
- At 320px, all three labels and icons fit, all buttons remain 44px high, and the indicator aligns with the selected tab without page overflow. Desktop buttons measured approximately 107px each; mobile buttons measured approximately 93px each.
- Reduced-motion behavior was checked in an isolated localhost:3003 copy with only the relevant media rule enabled: pointer activation computed transition-property none and duration 0s, with the indicator aligned immediately. Direct browser preference emulation and physical touch testing were unavailable. No stored family data was changed during these checks.
- TypeScript, all 41 existing tests, and whitespace checks pass. React review confirmed that Base UI keeps tab semantics and geometry measurement; there is no duplicate interactive tab list, timer, layout animation, or new dependency. Browser proof: `/tmp/sparkquest-parent-sliding-tabs.png` (320px view). Temporary tabs/server were closed afterward.

| Before | After | Why |
| --- | --- | --- |
| Each active button paints its own static background | One native indicator slides between equal-width tabs | Makes the selection change legible without moving content |
| Parent tab triggers inherit transition-all | Scoped triggers stay immediate; indicator transitions transform only | Bounds motion and avoids layout animation |
| Shared indicator could animate keyboard or reduced-motion selections | Both update instantly | Preserves efficient keyboard operation and avoids requested motion |

**Approve** — justified, brief state indication; transform-only CSS transition; immediate content, keyboard and reduced-motion behavior; no new motion added to other tabs.
