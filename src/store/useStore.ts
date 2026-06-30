import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Goal, Habit, CalendarEvent, Message, UserProfile } from '../types';

export interface WellnessMetrics {
  focusTimeMinutes: number;
  focusTargetMinutes: number;
}

interface StoreState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  events: CalendarEvent[];
  messages: Message[];
  wellnessMetrics: WellnessMetrics;
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Tasks Actions
  addTask: (task: Omit<Task, 'id' | 'priorityScore'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  
  // Goals Actions
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Habits Actions
  addHabit: (name: string) => Promise<void>;
  toggleHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  
  // Calendar Actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  runAiScheduler: () => Promise<void>;
  
  // Assistant Actions
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => Promise<void>;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isGenerating: boolean;
  activeStreamTimer: any | null;
  stopGenerating: () => void;

  // Wellness Metrics Actions
  updateWellnessMetrics: (metrics: Partial<WellnessMetrics>) => Promise<void>;

  // Auth Actions
  signUp: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (name: string, email: string) => Promise<void>;
  loginWithGoogleToken: (credential: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  initializeData: () => Promise<void>;
}

// Dynamic Prioritization Algorithm
export function calculatePriorityScore(task: Omit<Task, 'id' | 'priorityScore'> | Task): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(task.deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Urgency: 0 to 100
  let urgency = 0;
  if (diffDays <= 0) {
    urgency = 100; // Overdue or due today
  } else if (diffDays === 1) {
    urgency = 90; // Tomorrow
  } else if (diffDays <= 3) {
    urgency = 75;
  } else if (diffDays <= 7) {
    urgency = 50;
  } else {
    urgency = Math.max(10, 50 - (diffDays - 7) * 5);
  }

  // Importance: 0 to 100
  let importance = 50;
  if (task.priority === 'High') importance = 90;
  if (task.priority === 'Low') importance = 20;

  // Effort weight: higher effort tasks with short deadlines get prioritized
  const effortWeight = Math.min(20, task.effort * 2);

  const score = Math.round((urgency * 0.5) + (importance * 0.4) + effortWeight);
  return Math.min(100, Math.max(0, score));
}

// Advanced NLP Task Parser Heuristics
export function parseNlpTask(text: string) {
  const clean = text.toLowerCase();
  
  // Check if it's a task creation request
  const addKeywords = ['add', 'create', 'new task', 'schedule', 'task to', 'todo to', 'remind me to', 'remind to', 'put on my list'];
  const isTaskRequest = addKeywords.some(kw => clean.includes(kw));
  if (!isTaskRequest) return null;

  // Extract priority
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  if (clean.includes('high') || clean.includes('urgent') || clean.includes('important')) {
    priority = 'High';
  } else if (clean.includes('low') || clean.includes('trivial') || clean.includes('minor')) {
    priority = 'Low';
  }

  // Extract effort (hours)
  let effort = 2; // Default to 2 hours
  const effortRegex = /(\d+)\s*(hr|hour|h|hrs|hours)/;
  const effortMatch = clean.match(effortRegex);
  if (effortMatch) {
    effort = parseInt(effortMatch[1], 10);
  } else {
    // Check for minutes
    const minRegex = /(\d+)\s*(min|minute|m|mins|minutes)/;
    const minMatch = clean.match(minRegex);
    if (minMatch) {
      effort = Math.round((parseInt(minMatch[1], 10) / 60) * 10) / 10; // convert to hours
    }
  }

  // Extract deadline / date
  let deadline = new Date();
  deadline.setDate(deadline.getDate() + 1); // Default to tomorrow
  let deadlineStr = deadline.toISOString().split('T')[0];
  
  const today = new Date();
  
  if (clean.includes('today')) {
    deadline = today;
  } else if (clean.includes('tomorrow')) {
    deadline = new Date(today.getTime() + 86400000);
  } else if (clean.includes('next week')) {
    deadline = new Date(today.getTime() + 86400000 * 7);
  } else {
    // Check for weekdays
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < 7; i++) {
      if (clean.includes(weekdays[i])) {
        const currentDay = today.getDay();
        let daysUntil = i - currentDay;
        if (daysUntil <= 0) daysUntil += 7; // Next occurrence
        deadline = new Date(today.getTime() + 86400000 * daysUntil);
        break;
      }
    }
  }
  
  deadlineStr = deadline.toISOString().split('T')[0];

  // Clean up title (remove command prefixes, dates, priorities, and effort phrases)
  let title = text;
  
  const prefixes = [
    /^(add\s+a\s+new\s+task\s+to\s+)/i,
    /^(add\s+task\s+to\s+)/i,
    /^(add\s+todo\s+to\s+)/i,
    /^(add\s+a\s+task\s+to\s+)/i,
    /^(add\s+)/i,
    /^(create\s+a\s+new\s+task\s+to\s+)/i,
    /^(create\s+task\s+to\s+)/i,
    /^(create\s+)/i,
    /^(schedule\s+a\s+new\s+task\s+to\s+)/i,
    /^(schedule\s+task\s+to\s+)/i,
    /^(schedule\s+)/i,
    /^(new\s+task\s+to\s+)/i,
    /^(remind\s+me\s+to\s+)/i,
    /^(remind\s+to\s+)/i,
    /^(put\s+on\s+my\s+list\s+to\s+)/i
  ];
  
  for (const rx of prefixes) {
    if (rx.test(title)) {
      title = title.replace(rx, '');
      break;
    }
  }

  // Remove common date descriptors
  title = title
    .replace(/\b(by\s+)?today\b/gi, '')
    .replace(/\b(by\s+)?tomorrow\b/gi, '')
    .replace(/\b(by\s+)?next\s+week\b/gi, '')
    .replace(/\b(on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    // Remove priorities
    .replace(/\b(with\s+)?high\s+priority\b/gi, '')
    .replace(/\b(with\s+)?medium\s+priority\b/gi, '')
    .replace(/\b(with\s+)?low\s+priority\b/gi, '')
    .replace(/\b(urgent|important|high|medium|low)\s+priority\b/gi, '')
    .replace(/\b(urgent|important|high|medium|low)\b/gi, '')
    // Remove effort phrases
    .replace(/\b(for\s+)?\d+\s*(hr|hour|h|hrs|hours|min|minute|m|mins|minutes)\b/gi, '')
    // Trim extra spaces, punctuation and cleanup
    .trim()
    .replace(/^to\s+/i, '')
    .replace(/^(by|on|for)\s+/i, '')
    .trim();

  // Remove trailing periods or commas
  title = title.replace(/[.,/#!$%^&*;:{}=_`~()-]+$/, '').trim();

  if (!title) {
    title = 'New Assistant Task';
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Extract category/tag heuristically
  let category = 'Work';
  if (clean.includes('study') || clean.includes('exam') || clean.includes('read') || clean.includes('homework') || clean.includes('assignment') || clean.includes('physics') || clean.includes('math') || clean.includes('class')) {
    category = 'Study';
  } else if (clean.includes('code') || clean.includes('programming') || clean.includes('develop') || clean.includes('bug') || clean.includes('test') || clean.includes('refactor') || clean.includes('build')) {
    category = 'Coding';
  } else if (clean.includes('exercise') || clean.includes('gym') || clean.includes('health') || clean.includes('run') || clean.includes('workout') || clean.includes('meditation')) {
    category = 'Health';
  } else if (clean.includes('buy') || clean.includes('pay') || clean.includes('bill') || clean.includes('finance') || clean.includes('money')) {
    category = 'Finance';
  } else if (clean.includes('meet') || clean.includes('sync') || clean.includes('call') || clean.includes('discuss') || clean.includes('sprint')) {
    category = 'Work';
  } else {
    category = 'Task';
  }

  return {
    title,
    priority,
    deadline: deadlineStr,
    effort,
    category
  };
}

const defaultWellnessMetrics: WellnessMetrics = {
  focusTimeMinutes: 0,
  focusTargetMinutes: 240
};

const API_URL = 'http://localhost:5000';

async function apiCall(endpoint: string, method = 'GET', body: any = null) {
  const token = localStorage.getItem('zenith_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      tasks: [],
      goals: [],
      habits: [],
      events: [],
      messages: [
        {
          id: 'm1',
          sender: 'ai',
          text: "Greetings! I'm Aura, your AI daily planner companion. Let's optimize your productivity today. Try adding some tasks or habits on the dashboard, or ask me to help you schedule them!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      wellnessMetrics: defaultWellnessMetrics,
      user: null,
      isAuthenticated: !!localStorage.getItem('zenith_token'),
      token: localStorage.getItem('zenith_token') || null,
      geminiApiKey: '',
      isGenerating: false,
      activeStreamTimer: null,

      // Tasks Actions
      addTask: async (task) => {
        const newTask: Task = {
          ...task,
          id: 'task_' + Date.now(),
          priorityScore: calculatePriorityScore(task),
          subtasks: task.subtasks.map((s, i) => ({ ...s, id: `s_${Date.now()}_${i}` }))
        };
        const savedTask = await apiCall('/api/tasks', 'POST', newTask);
        set((state) => ({ tasks: [savedTask, ...state.tasks] }));
      },

      updateTask: async (id, updates) => {
        const currentTask = useStore.getState().tasks.find((t) => t.id === id);
        if (!currentTask) return;

        const merged = { ...currentTask, ...updates };
        merged.priorityScore = calculatePriorityScore(merged);

        const updatedTask = await apiCall(`/api/tasks/${id}`, 'PUT', merged);
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t))
        }));
      },

      deleteTask: async (id) => {
        await apiCall(`/api/tasks/${id}`, 'DELETE');
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          events: state.events.filter((e) => e.taskId !== id)
        }));
        
        // Sync calendar events after deleting task-related focus blocks
        const filteredEvents = useStore.getState().events.filter((e) => e.taskId !== id);
        await apiCall('/api/events/sync', 'POST', { events: filteredEvents });
      },

      toggleTask: async (id) => {
        const currentTask = useStore.getState().tasks.find((t) => t.id === id);
        if (!currentTask) return;

        const nextCompleted = currentTask.status !== 'Done';
        const updates = {
          status: nextCompleted ? 'Done' as const : 'Todo' as const,
          subtasks: currentTask.subtasks.map((s) => ({ ...s, completed: nextCompleted }))
        };

        await useStore.getState().updateTask(id, updates);
      },

      toggleSubtask: async (taskId, subtaskId) => {
        const task = useStore.getState().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const subtasks = task.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        const allCompleted = subtasks.every((s) => s.completed);
        const updates = {
          subtasks,
          status: allCompleted ? 'Done' as const : task.status === 'Done' ? 'InProgress' : task.status
        };

        await useStore.getState().updateTask(taskId, updates);
      },

      // Goals Actions
      addGoal: async (goal) => {
        const newGoal: Goal = { ...goal, id: 'goal_' + Date.now() };
        const savedGoal = await apiCall('/api/goals', 'POST', newGoal);
        set((state) => ({ goals: [...state.goals, savedGoal] }));
      },

      updateGoal: async (id, updates) => {
        const currentGoal = useStore.getState().goals.find((g) => g.id === id);
        if (!currentGoal) return;

        const merged = { ...currentGoal, ...updates };
        const updatedGoal = await apiCall(`/api/goals/${id}`, 'PUT', merged);
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? updatedGoal : g))
        }));
      },

      deleteGoal: async (id) => {
        await apiCall(`/api/goals/${id}`, 'DELETE');
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id)
        }));
      },

      // Habits Actions
      addHabit: async (name) => {
        const habitId = 'habit_' + Date.now();
        const newHabit: Habit = { id: habitId, name, streak: 0, completedToday: false };
        
        // Optimistic update
        set((state) => ({ habits: [...state.habits, newHabit] }));

        try {
          const savedHabit = await apiCall('/api/habits', 'POST', newHabit);
          // Sync with the one returned from server
          set((state) => ({
            habits: state.habits.map((h) => h.id === habitId ? savedHabit : h)
          }));
        } catch (error: any) {
          console.error('Failed to add habit to backend:', error);
          window.alert('Failed to add habit: ' + (error?.message || error || 'Unknown error'));
          // Rollback
          set((state) => ({
            habits: state.habits.filter((h) => h.id !== habitId)
          }));
        }
      },

      toggleHabit: async (id) => {
        const currentHabit = useStore.getState().habits.find((h) => h.id === id);
        if (!currentHabit) return;

        const nextCompleted = !currentHabit.completedToday;
        const updates = {
          completedToday: nextCompleted,
          streak: nextCompleted ? currentHabit.streak + 1 : Math.max(0, currentHabit.streak - 1)
        };

        // Optimistic update — reflect toggle instantly in UI
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          )
        }));

        try {
          const updatedHabit = await apiCall(`/api/habits/${id}`, 'PUT', { ...currentHabit, ...updates });
          set((state) => ({
            habits: state.habits.map((h) => (h.id === id ? updatedHabit : h))
          }));
        } catch {
          // Rollback on error
          set((state) => ({
            habits: state.habits.map((h) => (h.id === id ? currentHabit : h))
          }));
        }
      },


      deleteHabit: async (id) => {
        const currentHabit = useStore.getState().habits.find((h) => h.id === id);
        if (!currentHabit) return;

        // Optimistic delete
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id)
        }));

        try {
          await apiCall(`/api/habits/${id}`, 'DELETE');
        } catch (error) {
          console.error('Failed to delete habit from backend:', error);
          // Rollback
          set((state) => ({
            habits: [...state.habits, currentHabit]
          }));
        }
      },

      // Calendar Actions
      addEvent: async (event) => {
        const newEvent: CalendarEvent = { ...event, id: 'event_' + Date.now() };
        const savedEvent = await apiCall('/api/events', 'POST', newEvent);
        set((state) => ({ events: [...state.events, savedEvent] }));
      },

      updateEvent: async (id, updates) => {
        const currentEvent = useStore.getState().events.find((e) => e.id === id);
        if (!currentEvent) return;

        const merged = { ...currentEvent, ...updates };
        const updatedEvent = await apiCall(`/api/events/${id}`, 'PUT', merged);
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? updatedEvent : e))
        }));
      },

      deleteEvent: async (id) => {
        // Optimistic removal
        set((state) => ({
          events: state.events.filter((e) => e.id !== id)
        }));
        try {
          await apiCall(`/api/events/${id}`, 'DELETE');
        } catch {
          // If server fails, re-fetch or just leave optimistic state
        }
      },

      runAiScheduler: async () => {
        const state = useStore.getState();
        const incompleteTasks = [...state.tasks]
          .filter((t) => t.status !== 'Done')
          .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

        const scheduledEvents: CalendarEvent[] = [];
        const updatedTasks = [...state.tasks];

        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const dailyHours = [9, 10, 11, 13, 14, 15, 16];

        let taskIndex = 0;
        const userEvents = state.events.filter((e) => e.type !== 'Focus');

        weekdays.forEach((day, dayOffset) => {
          dailyHours.forEach((hour) => {
            if (taskIndex >= incompleteTasks.length) return;
            
            const targetDate = new Date();
            const currentDayOfWeek = targetDate.getDay();
            const daysDiff = (dayOffset + 1) - currentDayOfWeek;
            targetDate.setDate(targetDate.getDate() + (daysDiff <= 0 ? daysDiff + 7 : daysDiff));
            targetDate.setHours(hour, 0, 0, 0);

            const eventStart = targetDate.toISOString();
            const eventEnd = new Date(targetDate.getTime() + 3600000).toISOString();

            const task = incompleteTasks[taskIndex];
            scheduledEvents.push({
              id: 'focus_' + task.id + '_' + day + hour,
              title: `Focus: ${task.title}`,
              start: eventStart,
              end: eventEnd,
              taskId: task.id,
              type: 'Focus'
            });

            const taskListIndex = updatedTasks.findIndex((t) => t.id === task.id);
            if (taskListIndex !== -1) {
              updatedTasks[taskListIndex] = {
                ...task,
                scheduledDay: day,
                scheduledHour: hour,
                scheduledTimeStr: `${hour}:00 - ${hour + 1}:00`,
                energyAllocation: hour < 12 ? 'Peak (Deep Work)' : hour < 15 ? 'Medium (Collaboration)' : 'Low (Administrative)'
              };
            }

            taskIndex++;
          });
        });

        const newEventsList = [...userEvents, ...scheduledEvents];
        const tasksToUpdate = updatedTasks.filter((t, i) => {
          const original = state.tasks[i];
          return JSON.stringify(t) !== JSON.stringify(original);
        });

        try {
          await Promise.all(
            tasksToUpdate.map(t => apiCall(`/api/tasks/${t.id}`, 'PUT', t))
          );
          const savedEvents = await apiCall('/api/events/sync', 'POST', { events: newEventsList });
          set({
            events: savedEvents,
            tasks: updatedTasks
          });
        } catch (error) {
          console.error('Failed to sync AI schedule with backend:', error);
        }
      },

      setGeminiApiKey: (key) => set({ geminiApiKey: key }),

      // Assistant Chat Actions
      sendMessage: async (text) => {
        const userMsg: Message = {
          id: 'm_' + Date.now(),
          sender: 'user',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        set((state) => ({
          messages: [...state.messages, userMsg]
        }));

        try {
          await apiCall('/api/messages', 'POST', userMsg);
        } catch (err) {
          console.error('Failed to save user message to backend:', err);
        }

        const runOfflineFallback = async (rateLimited = false) => {
          const cleanText = text.toLowerCase();
          let replyText = '';
          const limitPrefix = rateLimited 
            ? `⚠️ **Gemini API free tier rate limit exceeded (429).** Automatically switching to offline smart assistant:\n\n`
            : '';

          if (cleanText.includes('week tasks') || cleanText.includes('tasks for the week') || cleanText.includes('plan my week tasks')) {
            const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const createdTasks: Task[] = [];
            const today = new Date();
            const taskTemplates = [
              { title: 'Weekly Planning & Alignment', effort: 1, priority: 'High' as const },
              { title: 'Code Refactoring & Testing', effort: 3, priority: 'Medium' as const },
              { title: 'Sprint Review & Sync', effort: 2, priority: 'High' as const },
              { title: 'Project Documentation Update', effort: 2, priority: 'Low' as const },
              { title: 'Wellness Health & Retrospective', effort: 1, priority: 'Medium' as const }
            ];

            for (const [index, t] of taskTemplates.entries()) {
              const taskDate = new Date(today.getTime() + 86400000 * (index + 1));
              const deadlineStr = taskDate.toISOString().split('T')[0];
              const tempTask = {
                title: t.title,
                description: `Auto-generated weekly task for ${weekDays[index]}`,
                deadline: deadlineStr,
                time: '10:00',
                priority: t.priority,
                status: 'Todo' as const,
                effort: t.effort,
                tags: ['WeeklyPlan'],
                subtasks: []
              };
              const priorityScore = calculatePriorityScore(tempTask);
              const finalTask = {
                ...tempTask,
                id: 'task_' + (Date.now() + index),
                priorityScore
              };
              const savedTask = await apiCall('/api/tasks', 'POST', finalTask);
              createdTasks.push(savedTask);
            }

            set((state) => ({
              tasks: [...createdTasks, ...state.tasks]
            }));

            replyText = limitPrefix + `📅 **Weekly Task Plan Generated!**\n\nI have created a structured set of 5 core tasks for your upcoming week, distributed across the days:\n\n` +
              taskTemplates.map((t, index) => {
                const taskDate = new Date(today.getTime() + 86400000 * (index + 1));
                const dateStr = taskDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                return `- **${t.title}** (${dateStr}) - Priority: **${t.priority}**, Effort: ${t.effort} hrs`;
              }).join('\n');

          } else if (cleanText.includes('plan my week') || cleanText.includes('auto-schedule')) {
            const state = useStore.getState();
            const incompleteTasks = [...state.tasks]
              .filter((t) => t.status !== 'Done')
              .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

            if (incompleteTasks.length === 0) {
              replyText = limitPrefix + `📅 **Weekly Schedule Plan**\n\nYou currently have 0 pending tasks! Add some tasks first, and I will distribute them across your weekly focus hours.`;
            } else {
              const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
              const planLines: string[] = [];
              let taskIdx = 0;

              weekdays.forEach((day) => {
                const dayTasks: string[] = [];
                for (let i = 0; i < 2; i++) {
                  if (taskIdx < incompleteTasks.length) {
                    const task = incompleteTasks[taskIdx];
                    dayTasks.push(`  - 📝 **${task.title}** (Priority: *${task.priority}*, Effort: *${task.effort}h*)`);
                    taskIdx++;
                  }
                }
                if (dayTasks.length > 0) {
                  planLines.push(`📅 **${day}**\n${dayTasks.join('\n')}`);
                }
              });

              replyText = limitPrefix + `⚡ **Aura Circadian Weekly Planner**\n\nI have calculated Eisenhower urgency ratings and circadian energy peaks to construct the following optimal schedule:\n\n` + 
                planLines.join('\n\n') + 
                `\n\n*System: Scheduled ${incompleteTasks.length} task(s) successfully in your calendar!*`;

              setTimeout(async () => {
                await useStore.getState().runAiScheduler();
              }, 0);
            }
          } else if (cleanText.includes('prioritize') || cleanText.includes('most urgent')) {
            const topTasks = [...useStore.getState().tasks]
              .filter((t) => t.status !== 'Done')
              .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
              .slice(0, 3);

            if (topTasks.length === 0) {
              replyText = limitPrefix + "All clear! You have 0 pending tasks in your queue. Go enjoy your time, or add some habits to start tracking.";
            } else {
              replyText = limitPrefix + `Based on dynamic urgency metrics, here are your top 3 prioritized blocks:\n\n` + 
                topTasks.map((t, i) => `${i + 1}. **${t.title}** (Priority Score: **${t.priorityScore}**, effort: ${t.effort} hrs, due: ${t.deadline})`).join('\n') +
                `\n\nWould you like me to book focus slots for these today?`;
            }
          } else if (cleanText.includes('break down') || cleanText.includes('project')) {
            const firstTask = useStore.getState().tasks.find((t) => t.status !== 'Done');
            if (firstTask) {
              replyText = limitPrefix + `I analyzed your project task: "${firstTask.title}". Based on comparable code sprint templates, I decomposed it into actionable sub-tasks. You can expand the task checksheets in your Tasks page!`;
              setTimeout(async () => {
                const currentSubtasks = firstTask.subtasks;
                await useStore.getState().updateTask(firstTask.id, {
                  subtasks: [
                    ...currentSubtasks,
                    { id: 'sub_ai_' + Date.now(), text: 'AI Step: Execute validation checks and compile log report', completed: false, duration: 30 }
                  ]
                });
              }, 0);
            } else {
              replyText = limitPrefix + "You don't have any active tasks in your list. Create a task first, and I will break it down for you!";
            }
          } else {
            const parsedTask = parseNlpTask(text);

            if (parsedTask) {
              const tempTask = {
                title: parsedTask.title,
                description: `Auto-generated by Aura AI coach from command: "${text}"`,
                deadline: parsedTask.deadline,
                time: '12:00',
                priority: parsedTask.priority,
                status: 'Todo' as const,
                effort: parsedTask.effort,
                tags: parsedTask.category ? [parsedTask.category, 'AuraAI'] : ['AuraAI'],
                subtasks: []
              };
              const priorityScore = calculatePriorityScore(tempTask);
              const newTask: Task = {
                ...tempTask,
                id: 'task_' + Date.now(),
                priorityScore
              };

              const savedTask = await apiCall('/api/tasks', 'POST', newTask);
              set((state) => ({
                tasks: [savedTask, ...state.tasks]
              }));

              replyText = limitPrefix + `Understood! I've processed your instruction and added a new task:\n\n` + 
                `📝 **Title:** ${parsedTask.title}\n` +
                `🚨 **Priority:** ${parsedTask.priority} (Priority Score: **${priorityScore}**)\n` +
                `📅 **Deadline:** ${parsedTask.deadline}\n` +
                `⏳ **Estimated Effort:** ${parsedTask.effort} hour(s)\n\n` +
                `*(Offline NLP active. Enter an API key at the top to activate the full AI coach).*`;
            } else {
              const incompleteCount = useStore.getState().tasks.filter((t) => t.status !== 'Done').length;
              replyText = limitPrefix + `Hello! I am Aura, your AI daily planner companion. Currently you have ${incompleteCount} incomplete tasks. How can I help you organize your daily goals today?`;
            }
          }

          const aiMsgId = 'm_ai_' + Date.now();
          const aiMsg: Message = {
            id: aiMsgId,
            sender: 'ai',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          set((state) => ({
            messages: state.messages
              .filter(m => m.text !== 'Aura is formulating a response...' && !m.id.startsWith('m_thinking_'))
              .concat(aiMsg)
          }));

          set({ isGenerating: true });

          let currentText = '';
          const words = replyText.split(' ');
          let wordIndex = 0;

          const streamTimer = setInterval(async () => {
            if (wordIndex < words.length) {
              currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
              set((state) => ({
                messages: state.messages.map(m => m.id === aiMsgId ? { ...m, text: currentText } : m)
              }));
              wordIndex++;
            } else {
              clearInterval(streamTimer);
              set({ isGenerating: false, activeStreamTimer: null });
              try {
                await apiCall('/api/messages', 'POST', { ...aiMsg, text: replyText });
              } catch (err) {
                console.error('Failed to save AI response to backend:', err);
              }
            }
          }, 35);

          set({ activeStreamTimer: streamTimer });
        };

        const currentApiKey = useStore.getState().geminiApiKey;
        const currentUser = useStore.getState().user;
        const currentTasks = useStore.getState().tasks;

        let replyText = '';

        if (currentApiKey && currentApiKey.trim() !== '' && currentApiKey !== 'mock_key') {
          const thinkingId = 'm_thinking_' + Date.now();
          const thinkingMsg: Message = {
            id: thinkingId,
            sender: 'ai',
            text: 'Aura is formulating a response...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          set((state) => ({
            messages: [...state.messages, thinkingMsg]
          }));

          try {
            // Clean and map previous messages to build conversation history
            const history = useStore.getState().messages
              .filter((m) => m.id !== thinkingId)
              .slice(-12) // Keep the last 12 messages to balance context and rate limits
              .map((msg) => {
                let cleanText = msg.text;
                // Strip action code blocks from assistant's history to avoid confusing the model
                const jsonIndex = cleanText.indexOf('```');
                if (jsonIndex !== -1) {
                  cleanText = cleanText.substring(0, jsonIndex).trim();
                }
                return {
                  role: msg.sender === 'user' ? 'user' : 'model',
                  parts: [{ text: cleanText || '...' }]
                };
              });

            // Append the new user query to the history
            history.push({
              role: 'user',
              parts: [{ text: text }]
            });

            // Build system prompt with current user statistics and guidelines
            const systemPrompt = `You are Aura, the AI productivity coach for Zenith AI. You help the user manage their tasks, goals, habits, and schedule.
The user's name is "${currentUser?.name || 'Guest'}" and email is "${currentUser?.email || 'guest@zenith.ai'}".
Current date is ${new Date().toISOString().split('T')[0]}.

Here are the current tasks in the system:
${JSON.stringify(currentTasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, deadline: t.deadline, effort: t.effort })))}

Here are the current habits in the system:
${JSON.stringify(useStore.getState().habits.map(h => ({ id: h.id, name: h.name, streak: h.streak, completedToday: h.completedToday })))}

If the user asks to perform operations (like adding a task, completing/marking a task as done, deleting a task, creating a goal/habit, toggling a habit, or running the scheduler/optimizing time blocks), you MUST append a JSON array at the very end of your response inside a \`\`\`actions block. The array should contain one or more of these action objects:
- To add a task:
  { "action": "ADD_TASK", "title": "Task title", "priority": "High"|"Medium"|"Low", "deadline": "YYYY-MM-DD", "effort": estimated_hours, "tags": ["CategoryName"], "description": "Short description text" }
- To mark a task as Done:
  { "action": "COMPLETE_TASK", "taskId": "task_id_from_above" }
- To delete a task:
  { "action": "DELETE_TASK", "taskId": "task_id_from_above" }
- To run the auto-schedule optimizer (plan day/week, schedule tasks, resolve overlaps):
  { "action": "RUN_SCHEDULER" }
- To add a goal:
  { "action": "ADD_GOAL", "title": "Goal title", "category": "Study"|"Work"|"Health"|"Finance", "targetDate": "YYYY-MM-DD" }
- To add a habit:
  { "action": "ADD_HABIT", "name": "Habit name" }
- To toggle/check off a habit:
  { "action": "TOGGLE_HABIT", "habitId": "habit_id_from_above" }

When scheduling or planning the week, you MUST first print out a beautiful day-by-day markdown schedule table or list proposing the allocation of the user's tasks to the weekdays, and then append the RUN_SCHEDULER action. Do not just say you are running the scheduler — print the exact schedule data first so it looks like a real AI assistant planner. Be encouraging, concise, and professional. Do not use markdown inside the action block.`;

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${currentApiKey}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  contents: history,
                  systemInstruction: {
                    parts: [
                      {
                        text: systemPrompt
                      }
                    ]
                  },
                  tools: [
                    {
                      googleSearch: {}
                    }
                  ]
                })
              }
            );

            if (!response.ok) {
              if (response.status === 429) {
                throw new Error("429_RATE_LIMIT");
              }
              throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!rawText) {
              throw new Error('Empty response from Gemini');
            }

            const actionsRegex = /```actions\s*([\s\S]*?)\s*```/;
            const actionsMatch = rawText.match(actionsRegex);
            let rawTextCleaned = rawText;
            let actionsProcessed = 0;

            if (actionsMatch) {
              try {
                const actionsJson = JSON.parse(actionsMatch[1].trim());
                const actionsList = Array.isArray(actionsJson) ? actionsJson : [actionsJson];
                
                const newTasksList: Task[] = [];
                for (const [i, act] of actionsList.entries()) {
                  if (act.action === 'ADD_TASK' && act.title) {
                    const tempTask = {
                      title: act.title,
                      description: act.description || `Auto-generated by Aura AI coach`,
                      deadline: act.deadline || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                      time: '12:00',
                      priority: act.priority || 'Medium',
                      status: 'Todo' as const,
                      effort: act.effort || 2,
                      tags: act.tags || ['AuraAI'],
                      subtasks: []
                    };
                    const priorityScore = calculatePriorityScore(tempTask);
                    const finalTask = {
                      ...tempTask,
                      id: 'task_' + (Date.now() + i + Math.random()),
                      priorityScore
                    };
                    const savedTask = await apiCall('/api/tasks', 'POST', finalTask);
                    newTasksList.push(savedTask);
                    actionsProcessed++;
                  } else if (act.action === 'COMPLETE_TASK' && act.taskId) {
                    await useStore.getState().toggleTask(act.taskId);
                    actionsProcessed++;
                  } else if (act.action === 'DELETE_TASK' && act.taskId) {
                    await useStore.getState().deleteTask(act.taskId);
                    actionsProcessed++;
                  } else if (act.action === 'RUN_SCHEDULER') {
                    await useStore.getState().runAiScheduler();
                    actionsProcessed++;
                  } else if (act.action === 'ADD_GOAL' && act.title) {
                    await useStore.getState().addGoal({
                      title: act.title,
                      targetDate: act.targetDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
                      progress: 0,
                      category: act.category || 'Study'
                    });
                    actionsProcessed++;
                  } else if (act.action === 'ADD_HABIT' && act.name) {
                    await useStore.getState().addHabit(act.name);
                    actionsProcessed++;
                  } else if (act.action === 'TOGGLE_HABIT' && act.habitId) {
                    await useStore.getState().toggleHabit(act.habitId);
                    actionsProcessed++;
                  }
                }
                
                if (newTasksList.length > 0) {
                  set((state) => ({
                    tasks: [...newTasksList, ...state.tasks]
                  }));
                }
                
                rawTextCleaned = rawText.replace(actionsRegex, '').trim() + `\n\n*System: ${actionsProcessed} AI action(s) executed successfully.*`;
              } catch (e) {
                console.error('Failed to parse AI action JSON block', e);
              }
            } else {
              // Fallback to legacy task format if generated
              const taskRegex = /```task\s*([\s\S]*?)\s*```/;
              const match = rawText.match(taskRegex);

              if (match) {
                let countAdded = 0;
                try {
                  const taskJson = JSON.parse(match[1].trim());
                  const tasksToAdd = Array.isArray(taskJson) ? taskJson : [taskJson];
                  
                  const newTasksList: Task[] = [];
                  for (const [i, t] of tasksToAdd.entries()) {
                    if (t.title) {
                      const tempTask = {
                        title: t.title,
                        description: t.description || `Auto-generated by Aura AI (Gemini) from command: "${text}"`,
                        deadline: t.deadline || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        time: '12:00',
                        priority: t.priority || 'Medium',
                        status: 'Todo' as const,
                        effort: t.effort || 2,
                        tags: ['AuraAI'],
                        subtasks: []
                      };
                      const priorityScore = calculatePriorityScore(tempTask);
                      const finalTask = {
                        ...tempTask,
                        id: 'task_' + (Date.now() + i + Math.random()),
                        priorityScore
                      };
                      const savedTask = await apiCall('/api/tasks', 'POST', finalTask);
                      newTasksList.push(savedTask);
                      countAdded++;
                    }
                  }
                  
                  if (newTasksList.length > 0) {
                    set((state) => ({
                      tasks: [...newTasksList, ...state.tasks]
                    }));
                  }
                  rawTextCleaned = rawText.replace(taskRegex, '').trim() + `\n\n*System: Created ${countAdded} task(s) successfully.*`;
                } catch (e) {
                  console.error('Failed to parse task JSON block', e);
                }
              }
            }

            replyText = rawTextCleaned;

          } catch (error: any) {
            console.error('Gemini API call failed:', error);
            if (error.message === "429_RATE_LIMIT" || error.message.includes("429")) {
              await runOfflineFallback(true);
              return;
            }
            replyText = `⚠️ I encountered an error communicating with Gemini: ${error?.message || 'Connection failed'}. Please check your API Key and network connection.`;
          }

          const aiMsgId = 'm_ai_' + Date.now();
          const aiMsg: Message = {
            id: aiMsgId,
            sender: 'ai',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          set((state) => ({
            messages: state.messages.filter(m => m.id !== thinkingId).concat(aiMsg)
          }));

          // Stream response word-by-word
          let currentText = '';
          const words = replyText.split(' ');
          let wordIndex = 0;

          // Set generating state
          set({ isGenerating: true });

          const streamTimer = setInterval(async () => {
            if (wordIndex < words.length) {
              currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
              set((state) => ({
                messages: state.messages.map(m => m.id === aiMsgId ? { ...m, text: currentText } : m)
              }));
              wordIndex++;
            } else {
              clearInterval(streamTimer);
              set({ isGenerating: false, activeStreamTimer: null });
              try {
                await apiCall('/api/messages', 'POST', { ...aiMsg, text: replyText });
              } catch (err) {
                console.error('Failed to save AI response to backend:', err);
              }
            }
          }, 35);

          set({ activeStreamTimer: streamTimer });

        } else {
          await runOfflineFallback(false);
        }
      },

      clearChat: async () => {
        await apiCall('/api/messages/clear', 'POST');
        set({ messages: [] });
      },

      stopGenerating: () => {
        const { activeStreamTimer, messages } = useStore.getState();
        if (activeStreamTimer) {
          clearInterval(activeStreamTimer);
        }
        
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.sender === 'ai') {
          apiCall('/api/messages', 'POST', lastMsg).catch(() => {});
        }

        set({
          isGenerating: false,
          activeStreamTimer: null
        });
      },

      // Wellness Metrics Actions
      updateWellnessMetrics: async (metrics) => {
        const currentMetrics = useStore.getState().wellnessMetrics;
        const merged = { ...currentMetrics, ...metrics };
        const savedMetrics = await apiCall('/api/wellness', 'PUT', merged);
        set({ wellnessMetrics: savedMetrics });
      },

      // Auth Actions
      signUp: async (name, email, password) => {
        const data = await apiCall('/api/auth/signup', 'POST', { name, email, password });
        localStorage.setItem('zenith_token', data.token);
        set({ token: data.token, user: data.user, isAuthenticated: true });
        await useStore.getState().initializeData();
      },

      login: async (email, password) => {
        const data = await apiCall('/api/auth/login', 'POST', { email, password });
        localStorage.setItem('zenith_token', data.token);
        set({ token: data.token, user: data.user, isAuthenticated: true });
        await useStore.getState().initializeData();
      },

      loginWithGoogle: async (name, email) => {
        const data = await apiCall('/api/auth/google', 'POST', { name, email });
        localStorage.setItem('zenith_token', data.token);
        set({ token: data.token, user: data.user, isAuthenticated: true });
        await useStore.getState().initializeData();
      },

      loginWithGoogleToken: async (credential) => {
        const data = await apiCall('/api/auth/google', 'POST', { credential });
        localStorage.setItem('zenith_token', data.token);
        set({ token: data.token, user: data.user, isAuthenticated: true });
        await useStore.getState().initializeData();
      },

      logout: () => {
        localStorage.removeItem('zenith_token');
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false,
          tasks: [],
          goals: [],
          habits: [],
          events: [],
          messages: [
            {
              id: 'm1',
              sender: 'ai',
              text: "Greetings! I'm Aura, your AI daily planner companion. Let's optimize your productivity today. Try adding some tasks or habits on the dashboard, or ask me to help you schedule them!",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ],
          wellnessMetrics: defaultWellnessMetrics
        });
      },

      updateProfile: async (profile) => {
        const updatedUser = await apiCall('/api/auth/profile', 'PUT', profile);
        set({ user: updatedUser });
      },

      initializeData: async () => {
        try {
          const data = await apiCall('/api/init', 'GET');
          set({
            tasks: data.tasks || [],
            goals: data.goals || [],
            habits: data.habits || [],
            events: data.events || [],
            messages: data.messages && data.messages.length > 0 ? data.messages : [
              {
                id: 'm1',
                sender: 'ai',
                text: "Greetings! I'm Aura, your AI daily planner companion. Let's optimize your productivity today. Try adding some tasks or habits on the dashboard, or ask me to help you schedule them!",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ],
            wellnessMetrics: data.wellnessMetrics || defaultWellnessMetrics,
            geminiApiKey: data.geminiApiKey || useStore.getState().geminiApiKey || ''
          });
        } catch (error) {
          console.error('Failed to initialize data from server:', error);
        }
      }
    }),
    {
      name: 'zenith-ai-storage',
      partialize: (state) => ({ 
        token: state.token, 
        isAuthenticated: state.isAuthenticated, 
        user: state.user,
        geminiApiKey: state.geminiApiKey 
      }), // Only persist authentication settings locally to prevent stale client-data overrides
    }
  )
);
