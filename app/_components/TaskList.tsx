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

      await updateKid(result.kid);
      await toggleCompletion(kid.id, task.id, selectedDate, checked);
      setCompletionsState(result.completions);
      refreshKids();
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
        <div className="grid gap-6 md:grid-cols-3">
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
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl text-gray-900 tracking-tight">{formatDate(selectedDate)}</h1>
        <div className="flex items-center gap-3">
          {!isToday() && (
            <button
              onClick={() => setSelectedDate(today())}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View today
            </button>
          )}
          <button
            onClick={() => setShowCalendar(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5"
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
        <div className="grid gap-6 md:grid-cols-3">
          {kids.map(kid => {
            const dateCompletions = getDateCompletions(kid.id);

            return (
              <div key={kid.id} className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-100" style={{ backgroundColor: 'hsl(var(--brand))' }}>
                    {kid.avatar || kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 leading-tight">{kid.name}</div>
                    <div className="text-sm font-medium text-indigo-600">{kid.points} pts available</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.filter(task =>
                    !task.assignedKids || task.assignedKids.length === 0 || task.assignedKids.includes(kid.id)
                  ).map(task => {
                    const isCompleted = dateCompletions[task.id] || false;
                    const canToggle = isToday();

                    return (
                      <label
                        key={`${kid.id}-${task.id}`}
                        className={`glass-card flex items-center gap-4 cursor-pointer hover:shadow-md active:scale-[0.99] group ${isCompleted ? 'border-emerald-200' : 'border-white'
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
                          <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${isCompleted
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-200 group-hover:border-indigo-400 bg-white'
                            }`}>
                            {isCompleted && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-md font-semibold transition-all duration-200 ${isCompleted ? 'text-emerald-900/60 line-through' : 'text-gray-900'
                            }`}>
                            {task.title}
                          </div>
                          <div
                            id={`task-${kid.id}-${task.id}-points`}
                            className={`text-sm font-medium ${isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}
                          >
                            +{task.points} points
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

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