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
