import express from 'express';
import { db } from '../firebase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// INITIALIZE USER DATA
router.get('/init', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Load all user subcollections in parallel
    const [tasksSnap, goalsSnap, habitsSnap, eventsSnap, messagesSnap, wellnessSnap] = await Promise.all([
      db.collection('users').doc(userId).collection('tasks').get(),
      db.collection('users').doc(userId).collection('goals').get(),
      db.collection('users').doc(userId).collection('habits').get(),
      db.collection('users').doc(userId).collection('events').get(),
      db.collection('users').doc(userId).collection('messages').get(),
      db.collection('users').doc(userId).collection('wellness').doc('metrics').get()
    ]);

    const tasks = [];
    tasksSnap.forEach(doc => tasks.push(doc.data()));

    const goals = [];
    goalsSnap.forEach(doc => goals.push(doc.data()));

    const habits = [];
    habitsSnap.forEach(doc => habits.push(doc.data()));

    const events = [];
    eventsSnap.forEach(doc => events.push(doc.data()));

    const messages = [];
    messagesSnap.forEach(doc => messages.push(doc.data()));

    const wellnessMetrics = wellnessSnap.exists 
      ? wellnessSnap.data() 
      : { focusTimeMinutes: 0, focusTargetMinutes: 240 };

    res.status(200).json({
      tasks,
      goals,
      habits,
      events,
      messages,
      wellnessMetrics,
      geminiApiKey: process.env.GEMINI_API_KEY || ''
    });
  } catch (error) {
    console.error('Init Data Error:', error);
    res.status(500).json({ message: 'Internal server error while retrieving data.' });
  }
});

// TASKS CRUD
router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const task = req.body;
    if (!task.id) {
      task.id = 'task_' + Date.now() + Math.random().toString(36).substr(2, 5);
    }
    await db.collection('users').doc(req.userId).collection('tasks').doc(task.id).set(task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ message: 'Failed to create task.' });
  }
});

router.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('users').doc(req.userId).collection('tasks').doc(id).update(updates);
    res.status(200).json({ id, ...updates });
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ message: 'Failed to update task.' });
  }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').doc(req.userId).collection('tasks').doc(id).delete();
    res.status(200).json({ id, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
});

// GOALS CRUD
router.post('/goals', authMiddleware, async (req, res) => {
  try {
    const goal = req.body;
    if (!goal.id) {
      goal.id = 'goal_' + Date.now() + Math.random().toString(36).substr(2, 5);
    }
    await db.collection('users').doc(req.userId).collection('goals').doc(goal.id).set(goal);
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create Goal Error:', error);
    res.status(500).json({ message: 'Failed to create goal.' });
  }
});

router.put('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('users').doc(req.userId).collection('goals').doc(id).update(updates);
    res.status(200).json({ id, ...updates });
  } catch (error) {
    console.error('Update Goal Error:', error);
    res.status(500).json({ message: 'Failed to update goal.' });
  }
});

router.delete('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').doc(req.userId).collection('goals').doc(id).delete();
    res.status(200).json({ id, message: 'Goal deleted successfully.' });
  } catch (error) {
    console.error('Delete Goal Error:', error);
    res.status(500).json({ message: 'Failed to delete goal.' });
  }
});

// HABITS CRUD
router.post('/habits', authMiddleware, async (req, res) => {
  console.log('📬 [Backend] POST /api/habits requested. Body:', req.body, 'UserId:', req.userId);
  try {
    const habit = req.body;
    if (!habit.id) {
      habit.id = 'habit_' + Date.now() + Math.random().toString(36).substr(2, 5);
    }
    console.log('💾 [Backend] Attempting to set Firestore doc at users/' + req.userId + '/habits/' + habit.id);
    await db.collection('users').doc(req.userId).collection('habits').doc(habit.id).set(habit);
    console.log('✅ [Backend] Firestore set successful for habit ID:', habit.id);
    res.status(201).json(habit);
  } catch (error) {
    console.error('❌ Create Habit Error:', error);
    res.status(500).json({ message: 'Failed to create habit.' });
  }
});

router.put('/habits/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('users').doc(req.userId).collection('habits').doc(id).update(updates);
    res.status(200).json({ id, ...updates });
  } catch (error) {
    console.error('Update Habit Error:', error);
    res.status(500).json({ message: 'Failed to update habit.' });
  }
});

router.delete('/habits/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').doc(req.userId).collection('habits').doc(id).delete();
    res.status(200).json({ id, message: 'Habit deleted successfully.' });
  } catch (error) {
    console.error('Delete Habit Error:', error);
    res.status(500).json({ message: 'Failed to delete habit.' });
  }
});

// EVENTS CRUD AND SYNC
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const event = req.body;
    if (!event.id) {
      event.id = 'event_' + Date.now() + Math.random().toString(36).substr(2, 5);
    }
    await db.collection('users').doc(req.userId).collection('events').doc(event.id).set(event);
    res.status(201).json(event);
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Failed to create event.' });
  }
});

router.put('/events/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('users').doc(req.userId).collection('events').doc(id).update(updates);
    res.status(200).json({ id, ...updates });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ message: 'Failed to update event.' });
  }
});

router.post('/events/sync', authMiddleware, async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ message: 'Events must be an array.' });
    }

    const eventsRef = db.collection('users').doc(req.userId).collection('events');
    const snapshot = await eventsRef.get();
    
    // Clear current events
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(eventsRef.doc(doc.id).delete());
    });
    await Promise.all(deletePromises);

    // Save new events
    const writePromises = [];
    events.forEach(event => {
      writePromises.push(eventsRef.doc(event.id).set(event));
    });
    await Promise.all(writePromises);

    res.status(200).json(events);
  } catch (error) {
    console.error('Sync Events Error:', error);
    res.status(500).json({ message: 'Failed to sync calendar events.' });
  }
});

// MESSAGES CRUD
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const message = req.body;
    if (!message.id) {
      message.id = 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5);
    }
    await db.collection('users').doc(req.userId).collection('messages').doc(message.id).set(message);
    res.status(201).json(message);
  } catch (error) {
    console.error('Create Message Error:', error);
    res.status(500).json({ message: 'Failed to save chat message.' });
  }
});

router.post('/messages/clear', authMiddleware, async (req, res) => {
  try {
    const messagesRef = db.collection('users').doc(req.userId).collection('messages');
    const snapshot = await messagesRef.get();
    
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(messagesRef.doc(doc.id).delete());
    });
    await Promise.all(deletePromises);

    res.status(200).json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Clear Messages Error:', error);
    res.status(500).json({ message: 'Failed to clear chat history.' });
  }
});

// WELLNESS METRICS
router.put('/wellness', authMiddleware, async (req, res) => {
  try {
    const metrics = req.body;
    await db.collection('users').doc(req.userId).collection('wellness').doc('metrics').set(metrics, { merge: true });
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Update Wellness Error:', error);
    res.status(500).json({ message: 'Failed to update wellness metrics.' });
  }
});

// PROFILE UPDATES
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    
    // Strip sensitive fields
    delete updates.passwordHash;
    delete updates.uid;
    delete updates.email;
    delete updates.createdAt;
    
    await db.collection('users').doc(req.userId).update(updates);
    
    const userDoc = await db.collection('users').doc(req.userId).get();
    const { passwordHash: _passwordHash, ...userProfile } = userDoc.data();
    
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update user profile.' });
  }
});

export default router;
