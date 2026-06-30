export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  duration?: number; // in minutes
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  time: string; // HH:MM
  priority: 'High' | 'Medium' | 'Low';
  status: 'Inbox' | 'Todo' | 'InProgress' | 'Done';
  effort: number; // estimated hours
  tags: string[];
  subtasks: SubTask[];
  priorityScore?: number; // calculated score
  scheduledDay?: string; // e.g. Monday
  scheduledHour?: number; // e.g. 9 (representing 9:00 AM)
  scheduledTimeStr?: string;
  energyAllocation?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  progress: number; // 0-100
  category: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  taskId?: string;
  type: 'Focus' | 'Meeting' | 'Buffer';
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string; // HH:MM
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  tier?: 'Free' | 'Pro' | 'Elite';
}
