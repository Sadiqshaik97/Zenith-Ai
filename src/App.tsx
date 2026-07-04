import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import TodayPage from './pages/TodayPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import AssistantPage from './pages/AssistantPage';
import GoalsPage from './pages/GoalsPage';
import InsightsPage from './pages/InsightsPage';
import InboxPage from './pages/InboxPage';

export default function App() {
  const initializeData = useStore((state) => state.initializeData);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="inbox" element={<InboxPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
