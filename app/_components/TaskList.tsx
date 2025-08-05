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
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{formatDate(selectedDate)}</h2>
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
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
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
              <div key={kid.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{backgroundColor: '#4B2EDE'}}>
                    {kid.avatar || kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{kid.name}</div>
                    <div className="text-sm text-gray-500">{kid.points} pts</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {tasks.filter(task => 
                    !task.assignedKids || task.assignedKids.length === 0 || task.assignedKids.includes(kid.id)
                  ).map(task => {
                    const isCompleted = dateCompletions[task.id] || false;
                    const canToggle = isToday();
                    
                    return (
                      <label
                        key={`${kid.id}-${task.id}`}
                        className={`card flex items-center gap-3 transition-colors ${
                          canToggle ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                        } ${isCompleted ? 'border-2' : ''}`}
                        style={isCompleted ? {backgroundColor: 'rgba(0, 200, 120, 0.1)', borderColor: '#00C878'} : {}}
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={e => handleTaskToggle(kid, task, e.target.checked)}
                          disabled={!canToggle}
                          className={`w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 ${
                            !canToggle ? 'opacity-50' : ''
                          }`}
                          aria-describedby={`task-${kid.id}-${task.id}-points`}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${
                            isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </div>
                          <div
                            id={`task-${kid.id}-${task.id}-points`}
                            className={`text-xs ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            {task.points} pts
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <div className="text-green-600 text-sm" aria-label="Completed">
                            ✓
                          </div>
                        )}
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
                    className="btn-primary w-full mt-3"
                  >
                    Redeem Rewards
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