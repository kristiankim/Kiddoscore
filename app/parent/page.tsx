'use client';

import { useState, useEffect } from 'react';
import { Kid, Task, Reward } from '../_lib/types';
import { 
  getKids, setKids, getTasks, setTasks, getRewards, setRewards,
  getCompletions, setCompletions
} from '../_lib/storage';
import { clearTodayCompletions, clearAllCompletions, recalcPointsFromCompletions } from '../_lib/points';
import { getWeekRange, isDateInRange } from '../_lib/date';
import { uid } from '../_lib/ids';
import { useKidContext } from '../_lib/context';
import { StatCard } from '../_components/StatCard';
import { ConfirmDialog } from '../_components/ConfirmDialog';
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
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    setKidsState(getKids());
    setTasksState(getTasks());
    setRewardsState(getRewards());
  };
  
  const addKid = () => {
    if (newKidName.trim()) {
      const newKid: Kid = {
        id: uid(),
        name: newKidName.trim(),
        points: 0
      };
      const updatedKids = [...kids, newKid];
      setKids(updatedKids);
      setKidsState(updatedKids);
      setNewKidName('');
      refreshKids();
    }
  };
  
  const removeKid = (kidId: string) => {
    const updatedKids = kids.filter(k => k.id !== kidId);
    setKids(updatedKids);
    setKidsState(updatedKids);
    refreshKids();
  };
  
  const adjustPoints = (kidId: string, delta: number) => {
    const updatedKids = kids.map(k => 
      k.id === kidId ? { ...k, points: Math.max(0, k.points + delta) } : k
    );
    setKids(updatedKids);
    setKidsState(updatedKids);
    refreshKids();
  };
  
  const addTask = () => {
    if (newTaskTitle.trim() && newTaskPoints) {
      const newTask: Task = {
        id: uid(),
        title: newTaskTitle.trim(),
        points: parseInt(newTaskPoints),
        active: true,
        assignedKids: newTaskAssignedKids.length > 0 ? newTaskAssignedKids : undefined
      };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      setTasksState(updatedTasks);
      setNewTaskTitle('');
      setNewTaskPoints('');
      setNewTaskAssignedKids([]);
    }
  };

  const handleKidAssignmentToggle = (kidId: string) => {
    setNewTaskAssignedKids(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };
  
  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, active: !t.active } : t
    );
    setTasks(updatedTasks);
    setTasksState(updatedTasks);
  };
  
  const removeTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    setTasksState(updatedTasks);
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

  const saveTaskEdit = () => {
    if (!editingTask || !editTaskTitle.trim() || !editTaskPoints) return;

    const updatedTasks = tasks.map(t => 
      t.id === editingTask.id 
        ? {
            ...t,
            title: editTaskTitle.trim(),
            points: parseInt(editTaskPoints),
            assignedKids: editTaskAssignedKids.length > 0 ? editTaskAssignedKids : undefined
          }
        : t
    );
    
    setTasks(updatedTasks);
    setTasksState(updatedTasks);
    closeEditTaskModal();
  };

  const handleEditKidAssignmentToggle = (kidId: string) => {
    setEditTaskAssignedKids(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };
  
  const addReward = () => {
    if (newRewardLabel.trim() && newRewardCost) {
      const newReward: Reward = {
        id: uid(),
        label: newRewardLabel.trim(),
        cost: parseInt(newRewardCost)
      };
      const updatedRewards = [...rewards, newReward];
      setRewards(updatedRewards);
      setRewardsState(updatedRewards);
      setNewRewardLabel('');
      setNewRewardCost('');
    }
  };
  
  const removeReward = (rewardId: string) => {
    const updatedRewards = rewards.filter(r => r.id !== rewardId);
    setRewards(updatedRewards);
    setRewardsState(updatedRewards);
  };
  
  const clearKidToday = (kidId: string) => {
    const completions = getCompletions();
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;
    
    const clearedCompletions = clearTodayCompletions(kidId, completions);
    const pointsLost = kid.points - recalcPointsFromCompletions(kid, tasks, clearedCompletions);
    
    const updatedKids = kids.map(k => 
      k.id === kidId ? { ...k, points: Math.max(0, k.points - pointsLost) } : k
    );
    
    setCompletions(clearedCompletions);
    setKids(updatedKids);
    setKidsState(updatedKids);
    refreshKids();
  };
  
  const newWeek = () => {
    setCompletions(clearAllCompletions());
  };
  
  const getWeeklyStats = () => {
    const { start, end } = getWeekRange();
    const completions = getCompletions();
    
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
  
  const weeklyStats = getWeeklyStats();
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Parent Settings</h1>
      </div>
      
      {/* Weekly Stats */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">This Week's Progress</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {weeklyStats.map(({ kid, weekPoints }) => (
            <StatCard
              key={kid.id}
              title={kid.name}
              value={weekPoints}
              subtitle="points this week"
            />
          ))}
        </div>
      </div>
      
      {/* Kids Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Kids</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newKidName}
            onChange={e => setNewKidName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKid()}
            placeholder="Kid name"
            className="input flex-1"
          />
          <button onClick={addKid} className="btn-primary">
            Add Kid
          </button>
        </div>
        
        <div className="space-y-2">
          {kids.map(kid => (
            <div key={kid.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{kid.name}</div>
                <div className="text-sm text-gray-500">{kid.points} points</div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustPoints(kid.id, -5)}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  -5
                </button>
                <button
                  onClick={() => adjustPoints(kid.id, 5)}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  +5
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'clearToday', data: kid.id })}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  Clear Today
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'removeKid', data: kid.id })}
                  className="btn-danger text-xs px-2 py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tasks Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        
        <div className="space-y-3">
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
              className="input w-20"
            />
            <button onClick={addTask} className="btn-primary">
              Add Task
            </button>
          </div>
          
          {/* Kid Assignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Assign to kids (leave empty for all):
            </label>
            <div className="flex gap-2 flex-wrap">
              {kids.map(kid => (
                <label key={kid.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTaskAssignedKids.includes(kid.id)}
                    onChange={() => handleKidAssignmentToggle(kid.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                      {kid.avatar || kid.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{kid.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="card flex items-center justify-between">
              <div className={`flex-1 ${!task.active ? 'opacity-50' : ''}`}>
                <div className="font-medium">{task.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{task.points} points</span>
                  {task.assignedKids && task.assignedKids.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex -space-x-1">
                        {task.assignedKids.map(kidId => {
                          const kid = kids.find(k => k.id === kidId);
                          if (!kid) return null;
                          return (
                            <div
                              key={kidId}
                              className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800 border border-white"
                              title={kid.name}
                            >
                              {kid.avatar || kid.name.charAt(0).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditTaskModal(task)}
                  className="btn-secondary text-xs px-2 py-1"
                  title="Edit task"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`text-xs px-2 py-1 ${task.active ? 'btn-secondary' : 'btn-success'}`}
                >
                  {task.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'removeTask', data: task.id })}
                  className="btn-danger text-xs px-2 py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rewards Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Rewards</h2>
        
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
            className="input w-20"
          />
          <button onClick={addReward} className="btn-primary">
            Add Reward
          </button>
        </div>
        
        <div className="space-y-2">
          {rewards.map(reward => (
            <div key={reward.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{reward.label}</div>
                <div className="text-sm text-gray-500">{reward.cost} points</div>
              </div>
              
              <button
                onClick={() => setConfirmAction({ type: 'removeReward', data: reward.id })}
                className="btn-danger text-xs px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
        
        <button
          onClick={() => setConfirmAction({ type: 'newWeek' })}
          className="btn-secondary"
        >
          Start New Week
        </button>
      </div>
      
      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
              <button
                onClick={closeEditTaskModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={e => setEditTaskTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={editTaskPoints}
                  onChange={e => setEditTaskPoints(e.target.value)}
                  className="input w-full"
                  placeholder="Points"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to kids (leave empty for all):
                </label>
                <div className="space-y-2">
                  {kids.map(kid => (
                    <label key={kid.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTaskAssignedKids.includes(kid.id)}
                        onChange={() => handleEditKidAssignmentToggle(kid.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                          {kid.avatar || kid.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700">{kid.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                onClick={closeEditTaskModal}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={saveTaskEdit}
                className="btn-primary flex-1"
                disabled={!editTaskTitle.trim() || !editTaskPoints}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            switch (confirmAction.type) {
              case 'removeKid':
                removeKid(confirmAction.data);
                break;
              case 'clearToday':
                clearKidToday(confirmAction.data);
                break;
              case 'removeTask':
                removeTask(confirmAction.data);
                break;
              case 'removeReward':
                removeReward(confirmAction.data);
                break;
              case 'newWeek':
                newWeek();
                break;
            }
            setConfirmAction(null);
          }}
          title="Confirm Action"
          message={
            confirmAction.type === 'removeKid' ? 'Remove this kid? This cannot be undone.' :
            confirmAction.type === 'clearToday' ? 'Clear today\'s completed tasks for this kid?' :
            confirmAction.type === 'removeTask' ? 'Remove this task? This cannot be undone.' :
            confirmAction.type === 'removeReward' ? 'Remove this reward? This cannot be undone.' :
            confirmAction.type === 'newWeek' ? 'Start a new week? This will clear all daily completions but keep points.' :
            'Are you sure?'
          }
          confirmText="Confirm"
        />
      )}
    </div>
  );
}