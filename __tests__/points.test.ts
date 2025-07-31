import { describe, it, expect } from 'vitest';
import { applyTaskToggle, redeemReward, recalcPointsFromCompletions } from '../app/_lib/points';
import { Kid, Task, Completions } from '../app/_lib/types';

describe('points utilities', () => {
  const mockKid: Kid = {
    id: 'kid1',
    name: 'Test Kid',
    points: 50
  };
  
  const mockTask: Task = {
    id: 'task1',
    title: 'Test Task',
    points: 10,
    active: true
  };
  
  describe('applyTaskToggle', () => {
    it('should add points when completing a task', () => {
      const completions: Completions = {};
      const result = applyTaskToggle(mockKid, mockTask, true, completions);
      
      expect(result.kid.points).toBe(60);
      expect(result.completions['2024-01-01']?.['kid1']?.['task1']).toBe(true);
    });
    
    it('should subtract points when uncompleting a task', () => {
      const completions: Completions = {
        '2024-01-01': {
          'kid1': {
            'task1': true
          }
        }
      };
      
      const result = applyTaskToggle(mockKid, mockTask, false, completions);
      
      expect(result.kid.points).toBe(40);
      expect(result.completions['2024-01-01']?.['kid1']?.['task1']).toBe(false);
    });
    
    it('should not change points if toggling to same state', () => {
      const completions: Completions = {
        '2024-01-01': {
          'kid1': {
            'task1': true
          }
        }
      };
      
      const result = applyTaskToggle(mockKid, mockTask, true, completions);
      
      expect(result.kid.points).toBe(50);
    });
  });
  
  describe('redeemReward', () => {
    it('should subtract points for valid redemption', () => {
      const result = redeemReward(mockKid, 30);
      expect(result.points).toBe(20);
    });
    
    it('should throw error for insufficient points', () => {
      expect(() => redeemReward(mockKid, 60)).toThrow('Insufficient points');
    });
  });
  
  describe('recalcPointsFromCompletions', () => {
    it('should calculate total points from completions', () => {
      const tasks: Task[] = [
        { id: 'task1', title: 'Task 1', points: 10, active: true },
        { id: 'task2', title: 'Task 2', points: 15, active: true }
      ];
      
      const completions: Completions = {
        '2024-01-01': {
          'kid1': {
            'task1': true,
            'task2': true
          }
        },
        '2024-01-02': {
          'kid1': {
            'task1': true
          }
        }
      };
      
      const total = recalcPointsFromCompletions(mockKid, tasks, completions);
      expect(total).toBe(35); // 10 + 15 + 10
    });
  });
});