"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  ArrowUpRight,
  Check,
  Loader2,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task, Kid, Completions } from "../_lib/types";
import { useKidContext } from "../_lib/context";
import { getTasks, getCompletions } from "../_lib/storage";
import { saveTaskCompletion } from "../_lib/tasks";
import { today } from "../_lib/date";
import { getTaskStreak } from "../_lib/streaks";
import { useRouter } from "next/navigation";
import { CalendarModal } from "./CalendarModal";

export function TaskList() {
  const {
    kids,
    selectedKid,
    refreshKids,
    setSelectedKid,
    isLoading: kidsLoading,
  } = useKidContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const saving = useRef(false);
  const calendarTrigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const isToday = selectedDate === today();

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [allTasks, savedCompletions] = await Promise.all([
        getTasks(),
        getCompletions(),
      ]);
      setTasks(allTasks.filter((task) => task.active));
      setCompletions(savedCompletions);
      await refreshKids();
      setNeedsRefresh(false);
    } catch {
      setError("Your tasks could not be loaded. Please try again.");
      setNeedsRefresh(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleTaskToggle(kid: Kid, task: Task, checked: boolean) {
    if (!isToday || saving.current || needsRefresh) return;
    saving.current = true;
    setPending(`${kid.id}-${task.id}`);
    setError("");
    const previous = completions;
    setCompletions((current) => ({
      ...current,
      [selectedDate]: {
        ...current[selectedDate],
        [kid.id]: { ...current[selectedDate]?.[kid.id], [task.id]: checked },
      },
    }));
    try {
      const result = await saveTaskCompletion(
        kid.id,
        task,
        selectedDate,
        checked,
      );
      setCompletions(result.completions);
      await refreshKids();
      setAnnouncement(
        checked
          ? `${task.title} completed. ${task.points} points earned.`
          : `${task.title} marked incomplete.`,
      );
    } catch {
      setCompletions(previous);
      setError("That change could not be saved. Refresh before trying again.");
      setNeedsRefresh(true);
    } finally {
      saving.current = false;
      setPending(null);
    }
  }

  const activeKidId = kids.some((kid) => kid.id === selectedKid?.id)
    ? selectedKid.id
    : kids[0]?.id;
  const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <div className="task-screen" data-count={kids.length || 1}>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isToday ? "Today" : "Past tasks"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          {!isToday && (
            <Button
              variant="ghost"
              className="min-h-11 px-3"
              onClick={() => setSelectedDate(today())}
            >
              Today
            </Button>
          )}
          <Button
            ref={calendarTrigger}
            disabled={!!pending}
            variant="outline"
            className="min-h-11 gap-2 px-3"
            onClick={() => setShowCalendar(true)}
            aria-haspopup="dialog"
            aria-expanded={showCalendar}
          >
            <CalendarDays aria-hidden="true" /> Calendar
          </Button>
        </div>
      </div>

      {!isToday && (
        <p className="mb-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          Viewing past tasks. You can check off tasks for today only.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
        >
          <p>{error}</p>
          <Button variant="outline" onClick={loadData} disabled={!!pending}>
            Refresh tasks
          </Button>
        </div>
      )}

      {kidsLoading || loading ? (
        <div
          role="status"
          aria-label="Loading tasks"
          className="space-y-4 motion-safe:animate-pulse"
        >
          <div className="h-10 w-40 rounded-lg bg-muted" />
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      ) : kids.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            A fresh start for your family
          </h2>
          <p className="mb-5 mt-2 text-sm text-muted-foreground">
            Add your first child to start building a daily routine.
          </p>
          <Button
            onClick={() => router.push("/parent")}
            className="min-h-11 px-4"
          >
            Add a child
          </Button>
        </div>
      ) : (
        <>
          {kids.length > 1 && (
            <div className="mb-6 md:hidden">
              <label
                htmlFor="task-child"
                className="mb-2 block text-sm font-medium"
              >
                Showing tasks for
              </label>
              <select
                id="task-child"
                disabled={!!pending}
                value={activeKidId}
                onChange={(event) =>
                  setSelectedKid(
                    kids.find((kid) => kid.id === event.target.value)!,
                  )
                }
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base"
              >
                {kids.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="task-grid">
            {kids.map((kid) => {
              const kidTasks = tasks.filter(
                (task) =>
                  !task.assignedKids?.length ||
                  task.assignedKids.includes(kid.id),
              );
              const completed = kidTasks.filter(
                (task) => completions[selectedDate]?.[kid.id]?.[task.id],
              ).length;
              const allDone =
                kidTasks.length > 0 && completed === kidTasks.length;
              return (
                <section
                  key={kid.id}
                  aria-labelledby={`kid-${kid.id}`}
                  className="task-child min-w-0"
                  data-selected={kid.id === activeKidId}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand"
                    >
                      {kid.avatar || kid.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2
                        id={`kid-${kid.id}`}
                        className="break-words text-base font-semibold text-foreground"
                      >
                        {kid.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <span className="font-medium tabular-nums text-foreground">
                          {kid.points}
                        </span>{" "}
                        points available
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="min-h-11 shrink-0 gap-1 px-2 text-brand"
                      onClick={() => {
                        setSelectedKid(kid);
                        router.push("/rewards");
                      }}
                    >
                      Rewards <ArrowUpRight aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {allDone ? "All done. Nice work!" : "Daily progress"}
                      </span>
                      <span className="tabular-nums">
                        {completed} of {kidTasks.length}
                      </span>
                    </div>
                    <progress
                      aria-label={`${kid.name}'s daily progress`}
                      value={completed}
                      max={kidTasks.length || 1}
                      className="task-progress"
                    />
                  </div>
                  <div className="task-cards">
                    {kidTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                        No tasks assigned yet. Add tasks in parent settings to
                        get started.
                      </div>
                    ) : (
                      kidTasks.map((task) => {
                        const checked =
                          !!completions[selectedDate]?.[kid.id]?.[task.id];
                        const rowPending = pending === `${kid.id}-${task.id}`;
                        const streak = getTaskStreak(
                          completions,
                          kid.id,
                          task.id,
                          selectedDate,
                          isToday,
                        );
                        return (
                          <label
                            key={task.id}
                            className="task-card"
                            data-completed={checked}
                            data-disabled={
                              !isToday || !!pending || needsRefresh
                            }
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isToday || !!pending || needsRefresh}
                              onChange={(event) =>
                                handleTaskToggle(
                                  kid,
                                  task,
                                  event.target.checked,
                                )
                              }
                              className="peer sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${checked ? "border-brand bg-brand text-white" : "border-muted-foreground bg-background"}`}
                            >
                              {rowPending ? (
                                <Loader2 className="size-3.5 motion-safe:animate-spin" />
                              ) : checked ? (
                                <Check className="size-3.5" strokeWidth={3} />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block break-words text-sm leading-6 ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}
                              >
                                {task.title}
                              </span>
                              <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="tabular-nums">
                                  +{task.points} points
                                </span>
                                <span
                                  className="task-streak inline-flex items-center gap-1.5"
                                  data-active={streak > 0}
                                >
                                  <Flame
                                    aria-hidden="true"
                                    className="size-3.5"
                                  />
                                  <span className="tabular-nums">
                                    {streak > 0
                                      ? `${streak}-day streak`
                                      : "Start a streak"}
                                  </span>
                                </span>
                              </span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => {
          setShowCalendar(false);
          requestAnimationFrame(() => calendarTrigger.current?.focus());
        }}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />
    </div>
  );
}
