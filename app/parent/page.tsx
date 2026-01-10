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
    <div className="min-h-screen bg-white font-['DM_Sans',sans-serif]">
      {/* Centered Dashboard Container */}
      <div className="w-full mx-auto pt-8 pb-20">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-12 px-1">
          <h1 className="text-[40px] font-medium font-['Clash_Display'] text-black leading-tight">
            Parent dashboard
          </h1>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-12 items-start">

          {/* Sidebar Navigation */}
          <nav className="w-48 flex flex-col gap-6 pt-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left text-base font-medium transition-colors ${activeTab === tab.id
                  ? "text-black font-bold"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div className="flex-1">
            {activeTab === 'kids' && (
              <div className="flex flex-col gap-6">

                {/* Kid Cards */}
                <div className="flex flex-col gap-4">
                  {kids.map(kid => {
                    const kidStats = weeklyStats.find(s => s.kid.id === kid.id);
                    return (
                      <div
                        key={kid.id}
                        className="glass-card flex items-center justify-between p-6"
                      >
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            {kid.avatar ? (
                              <img src={kid.avatar} alt={kid.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-lg">
                                {kid.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-black font-medium text-lg">{kid.name}</span>
                        </div>

                        {/* Stats Sections */}
                        <div className="flex items-center gap-12 ml-auto mr-12 text-center">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-black">{kidStats?.weekPoints || 0}</span>
                            <span className="text-gray-500 text-sm">points this week</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-black">
                              {tasks.filter(t => !t.assignedKids || t.assignedKids.includes(kid.id)).length}
                            </span>
                            <span className="text-gray-500 text-sm">tasks</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustPoints(kid.id, 5)}
                            className="w-10 h-8 flex items-center justify-center border border-[#d7d7d7] rounded hover:bg-gray-50 text-sm text-black"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => adjustPoints(kid.id, -5)}
                            className="w-10 h-8 flex items-center justify-center border border-[#d7d7d7] rounded hover:bg-gray-50 text-sm text-black"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'clearToday', data: kid.id })}
                            className="px-4 h-8 flex items-center justify-center border border-[#d7d7d7] rounded hover:bg-gray-50 text-sm text-black"
                          >
                            Clear today
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Kid Button */}
                <button
                  onClick={() => {/* add kid logic opens a modal or inline form */ }}
                  className="w-fit px-6 py-3 bg-[#2D6EFD] hover:bg-[#1a5adb] text-white rounded-lg font-medium flex items-center gap-2 transition-colors transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5v14" />
                  </svg>
                  Add new kid
                </button>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <h2 className="text-lg text-gray-900 font-bold mb-6">Tasks</h2>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Task title"
                      className="input flex-1"
                    />
                    <input
                      type="number"
                      value={newTaskPoints}
                      onChange={e => setNewTaskPoints(e.target.value)}
                      placeholder="Points"
                      className="input w-24"
                    />
                    <button onClick={addTaskHandler} className="btn-primary">
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Assign to kids (leave empty for all):
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {kids.map(kid => (
                        <label key={kid.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={newTaskAssignedKids.includes(kid.id)}
                            onChange={() => handleKidAssignmentToggle(kid.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-700">{kid.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-8">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-white border border-[#d7d7d7] rounded-xl p-5 flex items-center justify-between">
                      <div className={`flex-1 ${!task.active ? 'opacity-50' : ''}`}>
                        <div className="font-bold text-lg">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 font-medium">{task.points} points</span>
                          {task.assignedKids && task.assignedKids.length > 0 && (
                            <div className="flex items-center gap-2 -ml-1">
                              <span className="text-xs text-gray-400">•</span>
                              <div className="flex -space-x-2">
                                {task.assignedKids.map(kidId => {
                                  const kid = kids.find(k => k.id === kidId);
                                  if (!kid) return null;
                                  return (
                                    <div
                                      key={kidId}
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-800 border-2 border-white bg-blue-50"
                                      title={kid.name}
                                    >
                                      {kid.name.charAt(0)}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="p-2 hover:bg-gray-100 rounded text-gray-400"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`text-sm font-medium px-4 py-1.5 rounded-lg border ${task.active ? 'border-gray-200 text-gray-600' : 'border-green-200 text-green-600 bg-green-50'}`}
                        >
                          {task.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'removeTask', data: task.id })}
                          className="text-sm font-medium px-4 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-4">
                <h2 className="text-lg text-gray-900 font-bold mb-6">Rewards</h2>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRewardLabel}
                    onChange={e => setNewRewardLabel(e.target.value)}
                    placeholder="Reward label"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={newRewardCost}
                    onChange={e => setNewRewardCost(e.target.value)}
                    placeholder="Cost"
                    className="input w-24"
                  />
                  <button onClick={addRewardHandler} className="btn-primary">
                    Add Reward
                  </button>
                </div>

                <div className="space-y-3 mt-8">
                  {rewards.map(reward => (
                    <div key={reward.id} className="bg-white border border-[#d7d7d7] rounded-xl p-5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{reward.label}</div>
                        <div className="text-sm text-indigo-600 font-bold mt-1">{reward.cost} points</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditRewardModal(reward)}
                          className="p-2 hover:bg-gray-100 rounded text-gray-400"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'removeReward', data: reward.id })}
                          className="text-sm font-medium px-4 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals and Dialogs */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
            <div className="space-y-4">
              <input type="text" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} className="input" placeholder="Task title" />
              <input type="number" value={editTaskPoints} onChange={e => setEditTaskPoints(e.target.value)} className="input" placeholder="Points" />
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 italic">Assign to kids:</label>
                <div className="flex flex-wrap gap-2">
                  {kids.map(kid => (
                    <label key={kid.id} className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg">
                      <input type="checkbox" checked={editTaskAssignedKids.includes(kid.id)} onChange={() => handleEditKidAssignmentToggle(kid.id)} />
                      <span className="text-sm">{kid.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={closeEditTaskModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveTaskEdit} className="btn-primary flex-1">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {editingReward && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Edit Reward</h3>
            <div className="space-y-4">
              <input type="text" value={editRewardLabel} onChange={e => setEditRewardLabel(e.target.value)} className="input" placeholder="Reward label" />
              <input type="number" value={editRewardCost} onChange={e => setEditRewardCost(e.target.value)} className="input" placeholder="Cost" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={closeEditRewardModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveRewardEdit} className="btn-primary flex-1">Save Changes</button>
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
