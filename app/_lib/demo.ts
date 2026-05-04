import { Kid, Task, Reward, Completions } from './types';
import { uid } from './ids';
import { today } from './date';

const DEMO_MODE_KEY = 'sparkquest:demo-mode';

const DATA_KEYS = [
  'sparkquest:kids',
  'sparkquest:tasks',
  'sparkquest:rewards',
  'sparkquest:redemptions',
  'sparkquest:completions',
];

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function enableDemoMode(): void {
  if (typeof window === 'undefined') return;

  for (const key of DATA_KEYS) {
    localStorage.removeItem(key);
  }

  const mia: Kid = { id: uid(), name: 'Mia', points: 24 };
  const owen: Kid = { id: uid(), name: 'Owen', points: 18 };

  const makeBed: Task = { id: uid(), title: 'Make the bed', points: 5, active: true };
  const brushTeeth: Task = { id: uid(), title: 'Brush teeth (morning + night)', points: 3, active: true };
  const readBook: Task = { id: uid(), title: 'Read for 20 minutes', points: 8, active: true };
  const tidyRoom: Task = { id: uid(), title: 'Tidy bedroom', points: 7, active: true };
  const clearTable: Task = { id: uid(), title: 'Clear the dinner table', points: 6, active: true };
  const piano: Task = { id: uid(), title: 'Practice piano', points: 10, active: true, assignedKids: [mia.id] };
  const waterPlants: Task = { id: uid(), title: 'Water the plants', points: 4, active: true, assignedKids: [mia.id] };
  const mathHomework: Task = { id: uid(), title: 'Math worksheet', points: 10, active: true, assignedKids: [owen.id] };
  const walkDog: Task = { id: uid(), title: 'Walk the dog', points: 8, active: true, assignedKids: [owen.id] };

  const tasks: Task[] = [
    makeBed, brushTeeth, readBook, tidyRoom, clearTable,
    piano, waterPlants, mathHomework, walkDog,
  ];

  const rewards: Reward[] = [
    { id: uid(), label: '30 min screen time', cost: 20 },
    { id: uid(), label: 'Pick a movie for movie night', cost: 35 },
    { id: uid(), label: 'Stay up 30 min late', cost: 25 },
    { id: uid(), label: "Choose what's for dinner", cost: 40 },
    { id: uid(), label: 'Trip to the park', cost: 50 },
  ];

  const todayKey = today();
  const completions: Completions = {
    [todayKey]: {
      [mia.id]: { [makeBed.id]: true, [brushTeeth.id]: true },
      [owen.id]: { [makeBed.id]: true },
    },
  };

  localStorage.setItem('sparkquest:kids', JSON.stringify([mia, owen]));
  localStorage.setItem('sparkquest:tasks', JSON.stringify(tasks));
  localStorage.setItem('sparkquest:rewards', JSON.stringify(rewards));
  localStorage.setItem('sparkquest:completions', JSON.stringify(completions));
  localStorage.setItem('sparkquest:redemptions', JSON.stringify([]));
  localStorage.setItem(DEMO_MODE_KEY, 'true');
}

export function disableDemoMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_MODE_KEY);
  for (const key of DATA_KEYS) {
    localStorage.removeItem(key);
  }
}
