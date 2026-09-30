# Task cards and streaks exploration

Branch: `explore/task-cards-streaks`

Each task is an independent card, with a 2px hover lift and a light shadow on devices with a fine pointer. Keyboard focus outlines the whole card. Disabled cards do not lift, and reduced motion removes the movement.

Streaks are computed per child and task from saved daily completions. Completing today extends a consecutive streak; until today is complete, yesterday's streak remains available. A missed day ends the streak. Calendar views show the streak ending on the selected day. No extra database fields or sample completion history are added. Clearing completion history also clears the corresponding streaks.

Verified: desktop and 320px phone layout, hover lift, keyboard completion and undo, focus outline, and no horizontal overflow. The 41-test suite and TypeScript check pass, including streak cases for missing days, undone completions, separate children/tasks, historical dates, leap years, year boundaries, and daylight-saving changes.
