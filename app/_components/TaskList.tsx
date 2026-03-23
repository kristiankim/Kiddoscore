'use client';

import { useState, useEffect } from 'react';
import { Task, Kid, Completions } from '../_lib/types';
import { useKidContext } from '../_lib/context';
import { getTasks, getCompletions, updateKid, toggleCompletion } from '../_lib/storage';
import { applyTaskToggle, getTodayCompletions } from '../_lib/points';
import { today } from '../_lib/date';
import { useRouter } from 'next/navigation';
import { CalendarModal } from './CalendarModal';

export function TaskList() {
  const { kids, refreshKids, setSelectedKid, isLoading: kidsLoading } = useKidContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletionsState] = useState<Completions>({});
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [recentPoints, setRecentPoints] = useState<Record<string, number>>({});
  const [recentlyChecked, setRecentlyChecked] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingTasks(true);
      const allTasks = await getTasks();
      setTasks(allTasks.filter(t => t.active));
      setCompletionsState(await getCompletions());
      setIsLoadingTasks(false);
    };
    loadData();
  }, []);

  const handleTaskToggle = (kid: Kid, task: Task, checked: boolean) => {
    // Only allow toggling for today's date
    const todayDate = today();
    if (selectedDate !== todayDate) return;

    const updateData = async () => {
      const result = applyTaskToggle(kid, task, checked, completions);

      if (checked) {
        const animKey = `${kid.id}-${task.id}`;
        setRecentlyChecked(prev => new Set(prev).add(animKey));
        setRecentPoints(prev => ({ ...prev, [animKey]: task.points }));
        setTimeout(() => {
          setRecentlyChecked(prev => { const n = new Set(prev); n.delete(animKey); return n; });
        }, 500);
        setTimeout(() => {
          setRecentPoints(prev => { const n = { ...prev }; delete n[animKey]; return n; });
        }, 1400);
      }

      await updateKid(result.kid);
      await toggleCompletion(kid.id, task.id, selectedDate, checked);
      setCompletionsState(result.completions);
      refreshKids();

      setAnnouncement(
        checked
          ? `${task.title} completed. +${task.points} points earned.`
          : `${task.title} marked incomplete.`
      );
    };

    updateData();
  };

  if (kidsLoading || isLoadingTasks) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-10">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="card flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kids.length === 0) {
    return <div className="text-gray-500">No kids found</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00'); // Avoid timezone issues
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = () => {
    return selectedDate === today();
  };

  const getDateCompletions = (kidId: string) => {
    return completions[selectedDate]?.[kidId] || {};
  };

  return (
    <div className="space-y-4">
      {/* Screen reader announcements for task completion */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl text-gray-900 tracking-tight">{formatDate(selectedDate)}</h1>
        <div className="flex items-center gap-3">
          {!isToday() && (
            <button
              onClick={() => setSelectedDate(today())}
              className="text-brand hover:text-brand-dark text-sm font-medium min-h-[44px] flex items-center px-2"
            >
              View today
            </button>
          )}
          <button
            onClick={() => setShowCalendar(true)}
            className="text-brand hover:text-brand-dark text-sm font-medium flex items-center gap-1.5 min-h-[44px] px-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Open calendar
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-gray-500">No active tasks</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kids.map(kid => {
            const dateCompletions = getDateCompletions(kid.id);
            const kidTasks = tasks.filter(task =>
              !task.assignedKids || task.assignedKids.length === 0 || task.assignedKids.includes(kid.id)
            );
            const allTasksDone = isToday() && kidTasks.length > 0 && kidTasks.every(task => dateCompletions[task.id]);

            return (
              <div key={kid.id} className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-brand/10" style={{ backgroundColor: 'hsl(var(--brand))' }}>
                    {kid.avatar || kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 leading-tight">{kid.name}</div>
                    <div className="text-sm font-medium text-brand tabular-nums">{kid.points} pts available</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {kidTasks.map(task => {
                    const isCompleted = dateCompletions[task.id] || false;
                    const canToggle = isToday();

                    return (
                      <label
                        key={`${kid.id}-${task.id}`}
                        className={`card flex items-center gap-4 cursor-pointer hover:shadow-md active:scale-[0.99] group relative ${isCompleted ? 'border-success/30' : 'border-border'
                          }`}
                        style={isCompleted ? { backgroundColor: 'hsl(var(--success-light))' } : {}}
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={e => handleTaskToggle(kid, task, e.target.checked)}
                            disabled={!canToggle}
                            className="peer sr-only"
                            aria-describedby={`task-${kid.id}-${task.id}-points`}
                          />
                          <div className={[
                            'w-6 h-6 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center',
                            isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover:border-brand bg-white',
                            isCompleted && recentlyChecked.has(`${kid.id}-${task.id}`) ? 'animate-check-pop' : '',
                          ].join(' ')}>
                            {isCompleted && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-base font-semibold transition-all duration-200 ${isCompleted ? 'text-emerald-900/60 line-through' : 'text-gray-900'
                            }`}>
                            {task.title}
                          </div>
                          <div
                            id={`task-${kid.id}-${task.id}-points`}
                            className={`text-sm font-medium tabular-nums ${isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}
                          >
                            +{task.points} points
                          </div>
                        </div>
                        {(`${kid.id}-${task.id}`) in recentPoints && (
                          <div className="pts-float absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 text-sm font-bold z-10 whitespace-nowrap">
                            +{recentPoints[`${kid.id}-${task.id}`]} pts
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>

                {allTasksDone && (
                  <div className="animate-fade-slide-up flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-base leading-none">✨</span>
                    <span className="text-sm font-semibold text-emerald-700">All done for today!</span>
                  </div>
                )}
                {isToday() && (
                  <button
                    onClick={() => {
                      setSelectedKid(kid);
                      router.push('/rewards');
                    }}
                    className="btn-primary w-full mt-2"
                  >
                    Redeem Points
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />
    </div>
  );
}