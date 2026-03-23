'use client';

import { useState, useEffect } from 'react';
import { Kid, Task, Reward } from '../_lib/types';
import {
  getKids, getTasks, getRewards, getCompletions, setCompletions,
  addKid, updateKid, removeKid, addTask, updateTask, removeTask,
  addReward, updateReward, removeReward
} from '../_lib/storage';
import { clearTodayCompletions, clearAllCompletions, recalcPointsFromCompletions } from '../_lib/points';
import { getWeekRange, isDateInRange } from '../_lib/date';
import { useKidContext } from '../_lib/context';
import { StatCard } from '../_components/StatCard';
import { ConfirmDialog } from '../_components/ConfirmDialog';
import { DesignSystem } from '../_components/DesignSystem';
import Link from 'next/link';

export default function ParentPage() {
  const { refreshKids } = useKidContext();

  const [kids, setKidsState] = useState<Kid[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [rewards, setRewardsState] = useState<Reward[]>([]);

  const [newKidName, setNewKidName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskAssignedKids, setNewTaskAssignedKids] = useState<string[]>([]);
  const [newRewardLabel, setNewRewardLabel] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');

  const [confirmAction, setConfirmAction] = useState<{ type: string; data?: any } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPoints, setEditTaskPoints] = useState('');
  const [editTaskAssignedKids, setEditTaskAssignedKids] = useState<string[]>([]);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editRewardLabel, setEditRewardLabel] = useState('');
  const [editRewardCost, setEditRewardCost] = useState('');
  const [activeTab, setActiveTab] = useState('kids');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setKidsState(await getKids());
    setTasksState(await getTasks());
    setRewardsState(await getRewards());
  };

  const addKidHandler = async () => {
    if (newKidName.trim()) {
      const result = await addKid({
        name: newKidName.trim(),
        points: 0
      });
      if (result) {
        setNewKidName('');
        await loadData();
        refreshKids();
      }
    }
  };

  const removeKidHandler = async (kidId: string) => {
    await removeKid(kidId);
    await loadData();
    refreshKids();
  };

  const adjustPoints = async (kidId: string, delta: number) => {
    const kid = kids.find(k => k.id === kidId);
    if (kid) {
      await updateKid({ ...kid, points: Math.max(0, kid.points + delta) });
      await loadData();
      refreshKids();
    }
  };

  const addTaskHandler = async () => {
    if (newTaskTitle.trim() && newTaskPoints) {
      const result = await addTask({
        title: newTaskTitle.trim(),
        points: parseInt(newTaskPoints),
        active: true,
        assignedKids: newTaskAssignedKids.length > 0 ? newTaskAssignedKids : undefined
      });
      if (result) {
        setNewTaskTitle('');
        setNewTaskPoints('');
        setNewTaskAssignedKids([]);
        await loadData();
      }
    }
  };

  const handleKidAssignmentToggle = (kidId: string) => {
    setNewTaskAssignedKids(prev =>
      prev.includes(kidId)
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask({ ...task, active: !task.active });
      await loadData();
    }
  };

  const removeTaskHandler = async (taskId: string) => {
    await removeTask(taskId);
    await loadData();
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskPoints(task.points.toString());
    setEditTaskAssignedKids(task.assignedKids || []);
  };

  const closeEditTaskModal = () => {
    setEditingTask(null);
    setEditTaskTitle('');
    setEditTaskPoints('');
    setEditTaskAssignedKids([]);
  };

  const saveTaskEdit = async () => {
    if (!editingTask || !editTaskTitle.trim() || !editTaskPoints) return;

    await updateTask({
      ...editingTask,
      title: editTaskTitle.trim(),
      points: parseInt(editTaskPoints),
      assignedKids: editTaskAssignedKids.length > 0 ? editTaskAssignedKids : undefined
    });

    await loadData();
    closeEditTaskModal();
  };

  const handleEditKidAssignmentToggle = (kidId: string) => {
    setEditTaskAssignedKids(prev =>
      prev.includes(kidId)
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  const openEditRewardModal = (reward: Reward) => {
    setEditingReward(reward);
    setEditRewardLabel(reward.label);
    setEditRewardCost(reward.cost.toString());
  };

  const closeEditRewardModal = () => {
    setEditingReward(null);
    setEditRewardLabel('');
    setEditRewardCost('');
  };

  const saveRewardEdit = async () => {
    if (!editingReward || !editRewardLabel.trim() || !editRewardCost) return;

    await updateReward({
      ...editingReward,
      label: editRewardLabel.trim(),
      cost: parseInt(editRewardCost)
    });

    await loadData();
    closeEditRewardModal();
  };

  const addRewardHandler = async () => {
    if (newRewardLabel.trim() && newRewardCost) {
      const result = await addReward({
        label: newRewardLabel.trim(),
        cost: parseInt(newRewardCost)
      });
      if (result) {
        setNewRewardLabel('');
        setNewRewardCost('');
        await loadData();
      }
    }
  };

  const removeRewardHandler = async (rewardId: string) => {
    await removeReward(rewardId);
    await loadData();
  };

  const clearKidToday = async (kidId: string) => {
    const completions = await getCompletions();
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;

    const clearedCompletions = clearTodayCompletions(kidId, completions);
    const pointsLost = kid.points - recalcPointsFromCompletions(kid, tasks, clearedCompletions);

    await setCompletions(clearedCompletions);
    await updateKid({ ...kid, points: Math.max(0, kid.points - pointsLost) });
    await loadData();
    refreshKids();
  };

  const newWeek = async () => {
    await setCompletions(clearAllCompletions());
  };

  const getWeeklyStats = async () => {
    const { start, end } = getWeekRange();
    const completions = await getCompletions();

    return kids.map(kid => {
      let weekPoints = 0;

      Object.entries(completions).forEach(([date, dayCompletions]) => {
        if (isDateInRange(date, start, end)) {
          const kidCompletions = dayCompletions[kid.id] || {};
          Object.entries(kidCompletions).forEach(([taskId, isCompleted]) => {
            if (isCompleted) {
              const task = tasks.find(t => t.id === taskId);
              if (task) weekPoints += task.points;
            }
          });
        }
      });

      return { kid, weekPoints };
    });
  };

  const [weeklyStats, setWeeklyStats] = useState<{ kid: Kid; weekPoints: number }[]>([]);

  useEffect(() => {
    const loadWeeklyStats = async () => {
      const stats = await getWeeklyStats();
      setWeeklyStats(stats);
    };
    loadWeeklyStats();
  }, [kids, tasks]); // Recalculate when kids or tasks change

  const tabs = [
    { id: 'kids', label: 'Kids' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'rewards', label: 'Rewards' }
  ];

  return (
    <div className="pt-6 pb-20">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-medium font-display text-gray-900 leading-tight">
          Parent dashboard
        </h1>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">

        {/* Sidebar Navigation */}
        <nav className="w-full md:w-40 flex flex-row md:flex-col gap-1 md:gap-1 border-b md:border-b-0 border-gray-100 pb-4 md:pb-0 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${activeTab === tab.id
                ? 'bg-surface-secondary text-black font-semibold'
                : 'text-content-muted hover:text-content hover:bg-surface-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">

          {/* ── Kids ── */}
          {activeTab === 'kids' && (
            <div className="space-y-6">

              {/* Add kid form */}
              <div className="card space-y-3">
                <p className="text-xs font-semibold text-content-muted uppercase tracking-wider">Add child</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newKidName}
                    onChange={e => setNewKidName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKidHandler()}
                    placeholder="Child's name"
                    className="input flex-1"
                  />
                  <button
                    onClick={addKidHandler}
                    disabled={!newKidName.trim()}
                    className="btn-primary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Kid cards */}
              {kids.length > 0 && (
                <div className="space-y-3">
                  {kids.map(kid => {
                    const kidStats = weeklyStats.find(s => s.kid.id === kid.id);
                    return (
                      <div
                        key={kid.id}
                        className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            {kid.avatar ? (
                              <img src={kid.avatar} alt={kid.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-brand-light text-brand font-bold text-base">
                                {kid.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900">{kid.name}</span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-8 sm:ml-auto text-center">
                          <div>
                            <div className="text-xl font-bold text-gray-900 tabular-nums">{kidStats?.weekPoints || 0}</div>
                            <div className="text-xs text-content-muted mt-0.5">pts this week</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-gray-900 tabular-nums">
                              {tasks.filter(t => !t.assignedKids || t.assignedKids.includes(kid.id)).length}
                            </div>
                            <div className="text-xs text-content-muted mt-0.5">tasks</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-brand tabular-nums">{kid.points}</div>
                            <div className="text-xs text-content-muted mt-0.5">pts balance</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => adjustPoints(kid.id, 5)}
                            title="Add 5 points"
                            className="w-11 h-11 flex items-center justify-center border border-border rounded-lg hover:bg-surface-secondary text-sm font-medium text-gray-700 transition-colors"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => adjustPoints(kid.id, -5)}
                            title="Remove 5 points"
                            className="w-11 h-11 flex items-center justify-center border border-border rounded-lg hover:bg-surface-secondary text-sm font-medium text-gray-700 transition-colors"
                          >
                            −5
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'clearToday', data: kid.id })}
                            className="h-11 px-4 flex items-center border border-border rounded-lg hover:bg-surface-secondary text-sm text-gray-700 transition-colors"
                          >
                            Clear today
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'removeKid', data: kid.id })}
                            className="w-11 h-11 flex items-center justify-center hover:bg-danger-light rounded-lg transition-colors"
                            title="Remove child"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tasks ── */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">

              {/* Add task form */}
              <div className="card space-y-4">
                <p className="text-xs font-semibold text-content-muted uppercase tracking-wider">Add task</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTaskHandler()}
                    placeholder="Task name"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={newTaskPoints}
                    onChange={e => setNewTaskPoints(e.target.value)}
                    placeholder="Points"
                    className="input w-28"
                  />
                  <button onClick={addTaskHandler} className="btn-primary whitespace-nowrap">
                    Add task
                  </button>
                </div>
                {kids.length > 0 && (
                  <div>
                    <p className="text-xs text-content-muted mb-2">Assign to specific children (leave empty for all)</p>
                    <div className="flex gap-2 flex-wrap">
                      {kids.map(kid => (
                        <label key={kid.id} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-border hover:bg-surface-secondary transition-colors text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={newTaskAssignedKids.includes(kid.id)}
                            onChange={() => handleKidAssignmentToggle(kid.id)}
                            className="w-4 h-4 text-brand rounded focus:ring-2 focus:ring-brand/50"
                          />
                          {kid.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Task list */}
              {tasks.length > 0 && (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="card flex items-center gap-4">
                      <div className={`flex-1 min-w-0 ${!task.active ? 'opacity-40' : ''}`}>
                        <div className="font-semibold text-gray-900 truncate">{task.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm text-content-muted">{task.points} pts</span>
                          {task.assignedKids && task.assignedKids.length > 0 && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <div className="flex -space-x-1.5">
                                {task.assignedKids.map(kidId => {
                                  const kid = kids.find(k => k.id === kidId);
                                  if (!kid) return null;
                                  return (
                                    <div
                                      key={kidId}
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-brand border border-white bg-brand-light"
                                      title={kid.name}
                                    >
                                      {kid.name.charAt(0)}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-surface-secondary rounded-lg text-content-muted transition-colors"
                          title="Edit task"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`h-9 px-3 text-sm font-medium rounded-lg border transition-colors ${task.active
                            ? 'border-border text-content-muted hover:bg-surface-secondary'
                            : 'border-success/30 text-success bg-success-light'
                          }`}
                        >
                          {task.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'removeTask', data: task.id })}
                          className="w-9 h-9 flex items-center justify-center hover:bg-danger-light rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Rewards ── */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">

              {/* Add reward form */}
              <div className="card space-y-4">
                <p className="text-xs font-semibold text-content-muted uppercase tracking-wider">Add reward</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newRewardLabel}
                    onChange={e => setNewRewardLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRewardHandler()}
                    placeholder="Reward name"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={newRewardCost}
                    onChange={e => setNewRewardCost(e.target.value)}
                    placeholder="Points cost"
                    className="input w-32"
                  />
                  <button onClick={addRewardHandler} className="btn-primary whitespace-nowrap">
                    Add reward
                  </button>
                </div>
              </div>

              {/* Reward list */}
              {rewards.length > 0 && (
                <div className="space-y-2">
                  {rewards.map(reward => (
                    <div key={reward.id} className="card flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{reward.label}</div>
                        <div className="text-sm text-brand font-medium mt-0.5">{reward.cost} pts</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditRewardModal(reward)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-surface-secondary rounded-lg text-content-muted transition-colors"
                          title="Edit reward"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'removeReward', data: reward.id })}
                          className="w-9 h-9 flex items-center justify-center hover:bg-danger-light rounded-lg transition-colors"
                          title="Delete reward"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8 space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Edit task</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-content-muted block mb-1.5">Task name</label>
                <input type="text" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-content-muted block mb-1.5">Points</label>
                <input type="number" value={editTaskPoints} onChange={e => setEditTaskPoints(e.target.value)} className="input" />
              </div>
              {kids.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-content-muted block mb-2">Assign to children</label>
                  <div className="flex flex-wrap gap-2">
                    {kids.map(kid => (
                      <label key={kid.id} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-border hover:bg-surface-secondary transition-colors text-sm text-gray-700">
                        <input type="checkbox" checked={editTaskAssignedKids.includes(kid.id)} onChange={() => handleEditKidAssignmentToggle(kid.id)} className="w-4 h-4 text-brand rounded focus:ring-2 focus:ring-brand/50" />
                        {kid.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeEditTaskModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveTaskEdit} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {editingReward && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8 space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Edit reward</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-content-muted block mb-1.5">Reward name</label>
                <input type="text" value={editRewardLabel} onChange={e => setEditRewardLabel(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-content-muted block mb-1.5">Points cost</label>
                <input type="number" value={editRewardCost} onChange={e => setEditRewardCost(e.target.value)} className="input" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeEditRewardModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveRewardEdit} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            switch (confirmAction.type) {
              case 'removeKid': removeKidHandler(confirmAction.data); break;
              case 'clearToday': clearKidToday(confirmAction.data); break;
              case 'removeTask': removeTaskHandler(confirmAction.data); break;
              case 'removeReward': removeRewardHandler(confirmAction.data); break;
              case 'newWeek': newWeek(); break;
            }
            setConfirmAction(null);
          }}
          title="Are you sure?"
          message="This action cannot be undone."
          confirmText="Yes, Proceed"
        />
      )}
    </div>
  );
}
