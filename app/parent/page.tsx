"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Users,
  ListChecks,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Kid, Task, Reward, Completions } from "../_lib/types";
import * as storage from "../_lib/storage";
import { saveTaskCompletion } from "../_lib/tasks";
import { today, getWeekRange, isDateInRange } from "../_lib/date";
import { useKidContext } from "../_lib/context";

type Section = "kids" | "tasks" | "rewards";
type Draft = {
  id?: string;
  name: string;
  points: string;
  assignedKids: string[];
};
type Confirmation = {
  title: string;
  message: string;
  label: string;
  action: () => Promise<void>;
};
const emptyDraft = (): Draft => ({ name: "", points: "5", assignedKids: [] });
const actionStyle = "min-h-11 px-3";

export default function ParentPage() {
  const { refreshKids } = useKidContext();
  const [kids, setKids] = useState<Kid[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const [section, setSection] = useState<Section>("kids");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const busy = useRef(false);
  const editor = useRef<HTMLFormElement>(null);
  const refreshTrigger = useRef<HTMLButtonElement>(null);
  const confirmTrigger = useRef<HTMLElement | null>(null);

  async function loadData() {
    const [nextKids, nextTasks, nextRewards, nextCompletions] =
      await Promise.all([
        storage.getKids(),
        storage.getTasks(),
        storage.getRewards(),
        storage.getCompletions(),
      ]);
    setKids(nextKids);
    setTasks(nextTasks);
    setRewards(nextRewards);
    setCompletions(nextCompletions);
  }

  useEffect(() => {
    let mounted = true;
    loadData()
      .catch(() => {
        if (mounted)
          setError("Settings could not be loaded. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function run(
    action: () => Promise<void>,
    success: string,
  ): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      await action();
      await loadData();
      await refreshKids();
      setNeedsRefresh(false);
      setMessage(success);
      return true;
    } catch {
      setNeedsRefresh(true);
      setError(
        "Your change could not be saved. Please refresh settings and check the result before trying again.",
      );
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const changeSection = (value: Section) => {
    setSection(value);
    setDraft(emptyDraft());
    if (!needsRefresh) setError("");
    setMessage("");
  };

  const startEdit = (item: Kid | Task | Reward) => {
    setDraft({
      id: item.id,
      name:
        "name" in item ? item.name : "title" in item ? item.title : item.label,
      points: String("cost" in item ? item.cost : item.points),
      assignedKids: "assignedKids" in item ? item.assignedKids || [] : [],
    });
    setError("");
    setMessage("");
    requestAnimationFrame(() => {
      editor.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
      editor.current?.querySelector<HTMLInputElement>("input")?.focus();
    });
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.name.trim();
    const points = Number(draft.points);
    if (
      !name ||
      (section !== "kids" &&
        (!draft.points.trim() || !Number.isSafeInteger(points) || points < 1))
    ) {
      setError("Enter a name and a positive whole number for points.");
      return;
    }
    const saved = await run(
      async () => {
        if (section === "kids") {
          const current = (await storage.getKids()).find(
            (kid) => kid.id === draft.id,
          );
          if (draft.id && !current) throw new Error("Item no longer exists");
          if (draft.id && current)
            await storage.updateKid({ ...current, name });
          else if (!(await storage.addKid({ name, points: 0 })))
            throw new Error("Child not added");
        } else if (section === "tasks") {
          const current = (await storage.getTasks()).find(
            (task) => task.id === draft.id,
          );
          if (draft.id && !current) throw new Error("Item no longer exists");
          const values = {
            title: name,
            points,
            assignedKids: draft.assignedKids,
          };
          if (draft.id && current)
            await storage.updateTask({ ...current, ...values });
          else if (!(await storage.addTask({ ...values, active: true })))
            throw new Error("Task not added");
        } else {
          const values = { label: name, cost: points };
          const current = (await storage.getRewards()).find(
            (reward) => reward.id === draft.id,
          );
          if (draft.id && !current) throw new Error("Item no longer exists");
          if (draft.id && current)
            await storage.updateReward({ ...current, ...values });
          else if (!(await storage.addReward(values)))
            throw new Error("Reward not added");
        }
      },
      `${section === "kids" ? "Child" : section === "tasks" ? "Task" : "Reward"} ${draft.id ? "updated" : "added"}.`,
    );
    if (saved) {
      setDraft(emptyDraft());
      editor.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  }

  function ask(value: Confirmation) {
    confirmTrigger.current = document.activeElement as HTMLElement;
    setError("");
    setConfirmation(value);
  }
  function closeConfirmation() {
    setConfirmation(null);
    requestAnimationFrame(() => {
      if (
        confirmTrigger.current?.isConnected &&
        !confirmTrigger.current.matches(":disabled")
      )
        confirmTrigger.current.focus();
      else refreshTrigger.current?.focus();
    });
  }

  async function adjustPoints(kid: Kid, delta: number) {
    await run(async () => {
      const current = (await storage.getKids()).find(
        (item) => item.id === kid.id,
      );
      if (!current) throw new Error("Child missing");
      await storage.updateKid({
        ...current,
        points: Math.max(0, current.points + delta),
      });
    }, `${kid.name}'s points updated.`);
  }

  async function clearToday(kid: Kid) {
    const date = today();
    const [currentKids, currentTasks, currentCompletions] = await Promise.all([
      storage.getKids(),
      storage.getTasks(),
      storage.getCompletions(),
    ]);
    const currentKid = currentKids.find((item) => item.id === kid.id);
    if (!currentKid) throw new Error("Child missing");
    for (const [taskId, completed] of Object.entries(
      currentCompletions[date]?.[kid.id] || {},
    )) {
      if (!completed) continue;
      const task = currentTasks.find((item) => item.id === taskId);
      if (task) await saveTaskCompletion(kid.id, task, date, false);
      else await storage.toggleCompletion(kid.id, taskId, date, false);
    }
  }

  const { start, end } = getWeekRange();
  function weeklyPoints(kidId: string) {
    return Object.entries(completions).reduce(
      (total, [date, day]) =>
        total +
        (isDateInRange(date, start, end)
          ? Object.entries(day[kidId] || {}).reduce(
              (sum, [taskId, done]) =>
                sum +
                (done
                  ? tasks.find((task) => task.id === taskId)?.points || 0
                  : 0),
              0,
            )
          : 0),
      0,
    );
  }
  const noun =
    section === "kids" ? "child" : section === "tasks" ? "task" : "reward";
  const counts = {
    kids: kids.length,
    tasks: tasks.length,
    rewards: rewards.length,
  };
  const listTitle = {
    kids: "Your children",
    tasks: "Daily tasks",
    rewards: "Family rewards",
  };
  const description = {
    kids: "Manage profiles and point balances.",
    tasks: "Set the routines your children earn points for.",
    rewards: "Choose what your children can work toward.",
  };

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold text-foreground">
          Parent settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A routine that works for your family.
        </p>
      </header>
      <Tabs
        value={section}
        onValueChange={(value) => changeSection(value as Section)}
      >
        <TabsList
          aria-label="Parent settings"
          className="mb-6 !h-auto w-full p-1 sm:w-fit"
        >
          <TabsTrigger
            value="kids"
            disabled={pending}
            className="min-h-11 gap-2 px-3"
          >
            <Users aria-hidden="true" /> Children
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            disabled={pending}
            className="min-h-11 gap-2 px-3"
          >
            <ListChecks aria-hidden="true" /> Tasks
          </TabsTrigger>
          <TabsTrigger
            value="rewards"
            disabled={pending}
            className="min-h-11 gap-2 px-3"
          >
            <Gift aria-hidden="true" /> Rewards
          </TabsTrigger>
        </TabsList>
        {(["kids", "tasks", "rewards"] as Section[]).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {section === tab && (
              <>
                <div
                  role="status"
                  aria-live="polite"
                  className={
                    message
                      ? "mb-4 rounded-lg bg-brand-light px-4 py-3 text-sm text-brand"
                      : "sr-only"
                  }
                >
                  {message}
                </div>
                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-destructive/30 px-4 py-3 text-sm text-destructive"
                  >
                    <p>{error}</p>
                    <Button
                      variant="ghost"
                      className="mt-2 min-h-11"
                      ref={refreshTrigger}
                      disabled={pending}
                      onClick={() => run(async () => {}, "Settings refreshed.")}
                    >
                      Refresh settings
                    </Button>
                  </div>
                )}
                <div className="mb-5">
                  <h2 className="text-base font-semibold">
                    {listTitle[tab]}{" "}
                    <span className="ml-1 font-normal tabular-nums text-muted-foreground">
                      {counts[tab]}
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description[tab]}
                  </p>
                </div>
                <form
                  ref={editor}
                  onSubmit={save}
                  className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5"
                >
                  <h3 className="mb-4 text-sm font-semibold">
                    {draft.id ? "Edit" : "Add"} {noun}
                  </h3>
                  <fieldset
                    disabled={pending || loading || needsRefresh}
                    className="min-w-0"
                  >
                    <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                      <div className={tab === "kids" ? "sm:col-span-2" : ""}>
                        <label
                          htmlFor={`${tab}-name`}
                          className="mb-2 block text-sm font-medium"
                        >
                          {tab === "kids"
                            ? "Child’s name"
                            : tab === "tasks"
                              ? "Task name"
                              : "Reward name"}
                        </label>
                        <Input
                          id={`${tab}-name`}
                          required
                          maxLength={160}
                          value={draft.name}
                          onChange={(event) =>
                            setDraft({ ...draft, name: event.target.value })
                          }
                          placeholder={
                            tab === "kids"
                              ? "e.g. Mia"
                              : tab === "tasks"
                                ? "e.g. Make the bed"
                                : "e.g. Choose a movie"
                          }
                          className="h-11 text-base"
                        />
                      </div>
                      {tab !== "kids" && (
                        <div>
                          <label
                            htmlFor={`${tab}-points`}
                            className="mb-2 block text-sm font-medium"
                          >
                            {tab === "tasks" ? "Points earned" : "Points cost"}
                          </label>
                          <Input
                            id={`${tab}-points`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            max={1000000}
                            required
                            value={draft.points}
                            onChange={(event) =>
                              setDraft({ ...draft, points: event.target.value })
                            }
                            className="h-11 text-base"
                          />
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={pending || needsRefresh || !draft.name.trim()}
                        className="h-11 gap-2 px-4"
                      >
                        {pending ? (
                          <Loader2
                            aria-hidden="true"
                            className="motion-safe:animate-spin"
                          />
                        ) : !draft.id ? (
                          <Plus aria-hidden="true" />
                        ) : null}
                        {pending
                          ? "Saving…"
                          : draft.id
                            ? "Save changes"
                            : `Add ${noun}`}
                      </Button>
                    </div>
                    {tab === "tasks" && (
                      <fieldset className="mt-4 min-w-0">
                        <legend className="mb-2 text-sm font-medium">
                          Assign to
                        </legend>
                        <p className="mb-3 text-xs text-muted-foreground">
                          No selection means all children, including children
                          added later.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {kids.map((kid) => (
                            <label
                              key={kid.id}
                              className="flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted focus-within:ring-2 focus-within:ring-ring"
                            >
                              <input
                                type="checkbox"
                                checked={draft.assignedKids.includes(kid.id)}
                                onChange={() =>
                                  setDraft({
                                    ...draft,
                                    assignedKids: draft.assignedKids.includes(
                                      kid.id,
                                    )
                                      ? draft.assignedKids.filter(
                                          (id) => id !== kid.id,
                                        )
                                      : [...draft.assignedKids, kid.id],
                                  })
                                }
                                className="size-4 shrink-0 accent-brand"
                              />{" "}
                              <span className="min-w-0 break-words">
                                {kid.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    {draft.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-3 min-h-11"
                        onClick={() => setDraft(emptyDraft())}
                      >
                        Cancel editing
                      </Button>
                    )}
                  </fieldset>
                </form>
                {loading ? (
                  <div
                    aria-label="Loading settings"
                    role="status"
                    className="space-y-3 motion-safe:animate-pulse"
                  >
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="h-24 rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : counts[tab] === 0 ? (
                  <div className="py-8 text-center">
                    <h3 className="font-medium">
                      {tab === "kids"
                        ? "Add your first child"
                        : tab === "tasks"
                          ? "A small task is a great start"
                          : "Give them something to work toward"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Use the form above to add a {noun}.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border rounded-xl border border-border bg-card">
                    {tab === "kids" &&
                      kids.map((kid) => (
                        <article key={kid.id} className="p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light font-semibold text-brand"
                            >
                              {kid.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="break-words font-semibold">
                                {kid.name}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                <span className="font-medium tabular-nums text-foreground">
                                  {kid.points}
                                </span>{" "}
                                points available
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              className="size-11 shrink-0"
                              aria-label={`Edit ${kid.name}`}
                              disabled={pending || needsRefresh}
                              onClick={() => startEdit(kid)}
                            >
                              <Pencil />
                            </Button>
                          </div>
                          <p className="mt-4 text-sm text-muted-foreground">
                            {weeklyPoints(kid.id)} points earned this week ·{" "}
                            {
                              tasks.filter(
                                (task) =>
                                  task.active &&
                                  (!task.assignedKids?.length ||
                                    task.assignedKids.includes(kid.id)),
                              ).length
                            }{" "}
                            active tasks
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              className={actionStyle}
                              disabled={pending || needsRefresh}
                              aria-label={`Add 5 points to ${kid.name}`}
                              onClick={() => adjustPoints(kid, 5)}
                            >
                              +5 points
                            </Button>
                            <Button
                              variant="outline"
                              className={actionStyle}
                              disabled={
                                pending || needsRefresh || kid.points === 0
                              }
                              aria-label={`Remove 5 points from ${kid.name}`}
                              onClick={() => adjustPoints(kid, -5)}
                            >
                              −5 points
                            </Button>
                            <Button
                              variant="ghost"
                              className={actionStyle}
                              disabled={
                                pending ||
                                needsRefresh ||
                                !Object.values(
                                  completions[today()]?.[kid.id] || {},
                                ).some(Boolean)
                              }
                              onClick={() =>
                                ask({
                                  title: `Clear today for ${kid.name}?`,
                                  message:
                                    "This removes today’s completed tasks and the points earned from them. Other days remain unchanged.",
                                  label: "Clear today",
                                  action: () => clearToday(kid),
                                })
                              }
                            >
                              Clear today
                            </Button>
                            <Button
                              variant="ghost"
                              className="min-h-11 gap-2 px-3 text-destructive hover:bg-destructive/10"
                              disabled={pending || needsRefresh}
                              aria-label={`Remove ${kid.name}`}
                              onClick={() =>
                                ask({
                                  title: `Remove ${kid.name}?`,
                                  message:
                                    "This removes their profile and point balance. This action cannot be undone.",
                                  label: "Remove child",
                                  action: () => storage.removeKid(kid.id),
                                })
                              }
                            >
                              <Trash2 />
                              Remove
                            </Button>
                          </div>
                        </article>
                      ))}
                    {tab === "tasks" &&
                      tasks.map((task) => (
                        <article
                          key={task.id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5"
                        >
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words font-medium">
                              {task.title}
                            </h3>
                            <p className="mt-1 break-words text-sm text-muted-foreground">
                              {task.points} points ·{" "}
                              {task.assignedKids?.length
                                ? task.assignedKids
                                    .map(
                                      (id) =>
                                        kids.find((kid) => kid.id === id)?.name,
                                    )
                                    .filter(Boolean)
                                    .join(", ") ||
                                  "No current children assigned"
                                : "All children"}
                              {!task.active ? " · Paused" : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant={task.active ? "ghost" : "outline"}
                              className={actionStyle}
                              aria-label={`${task.active ? "Pause" : "Enable"} ${task.title}`}
                              disabled={pending || needsRefresh}
                              onClick={() =>
                                run(
                                  () =>
                                    storage.updateTask({
                                      ...task,
                                      active: !task.active,
                                    }),
                                  task.active
                                    ? "Task paused."
                                    : "Task enabled.",
                                )
                              }
                            >
                              {task.active ? "Pause" : "Enable"}
                            </Button>
                            <Button
                              variant="ghost"
                              className="size-11"
                              aria-label={`Edit ${task.title}`}
                              disabled={pending || needsRefresh}
                              onClick={() => startEdit(task)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              className="size-11 text-destructive hover:bg-destructive/10"
                              aria-label={`Delete ${task.title}`}
                              disabled={pending || needsRefresh}
                              onClick={() =>
                                ask({
                                  title: `Delete “${task.title}”?`,
                                  message:
                                    "This task will no longer be available. This action cannot be undone.",
                                  label: "Delete task",
                                  action: () => storage.removeTask(task.id),
                                })
                              }
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </article>
                      ))}
                    {tab === "rewards" &&
                      rewards.map((reward) => (
                        <article
                          key={reward.id}
                          className="flex items-center gap-3 p-4 sm:p-5"
                        >
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words font-medium">
                              {reward.label}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {reward.cost} points
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            className="size-11 shrink-0"
                            aria-label={`Edit ${reward.label}`}
                            disabled={pending || needsRefresh}
                            onClick={() => startEdit(reward)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            className="size-11 shrink-0 text-destructive hover:bg-destructive/10"
                            aria-label={`Delete ${reward.label}`}
                            disabled={pending || needsRefresh}
                            onClick={() =>
                              ask({
                                title: `Delete “${reward.label}”?`,
                                message:
                                  "This reward will no longer be available. Past redemptions remain in the history.",
                                label: "Delete reward",
                                action: () => storage.removeReward(reward.id),
                              })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </article>
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !pending) closeConfirmation();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="p-5"
          initialFocus={false}
        >
          <DialogTitle className="break-words leading-6">
            {confirmation?.title}
          </DialogTitle>
          <DialogDescription>{confirmation?.message}</DialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              autoFocus
              variant="outline"
              className={actionStyle}
              disabled={pending}
              onClick={closeConfirmation}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className={actionStyle}
              disabled={pending || needsRefresh}
              onClick={async () => {
                if (
                  confirmation &&
                  (await run(confirmation.action, "Settings updated."))
                )
                  closeConfirmation();
              }}
            >
              {pending ? "Saving…" : confirmation?.label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
