import React, { useEffect } from 'react';
import { checkTokenExpiration } from './utils/auth';
import {
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import API_BASE from './config/api';

import './css/style.css';

import './charts/ChartjsConfig';

// Import pages
import ManageSpeakingTopic from './pages/test/ManageSpeaking';
import EditSpeakingTest from './pages/test/EditSpeakingTest';
import Dashboard from './pages/Dashboard';
import Setting from './pages/Setting';
import Login from './pages/auth/Login';
import Feedback from './pages/data/Feedback';
import Key from './pages/data/Key';
import Notification from './pages/data/Notification';
import EditReadingTest from './pages/test/EditReadingTest';
import CreateStudent from './pages/student/CreateAccount';
import ManageStudent from './pages/student/ManageAccount';
import EditListeningTest from './pages/test/EditListeningTest';
import EditWritingTest from './pages/test/EditWritingTest';
import CreateListeningTest from './pages/test/CreateListeningTest';
import CreateReadingTest from './pages/test/CreateReadingTest';
import CreateSpeakingTest from './pages/test/CreateSpeakingTest';
import CreateWritingTest from './pages/test/CreateWritingTest';
import ManageTest from './pages/test/ManageTest';
import ManageForecast from './pages/test/ManageForecast';
import VIPPackageManagement from './pages/admin/VIPPackageManagement';
import SubscriptionsList from './pages/admin/SubscriptionsList';
import PendingTransactions from './pages/admin/PendingTransactions';
import DictationManagement from './pages/admin/DictationManagement';
import ManagePartTitles from './pages/test/ManagePartTitles';
import MarketingEmail from './pages/admin/MarketingEmail';

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  // Token expiration check
  useEffect(() => {
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  // Pre-warm backend + keep-alive to prevent Koyeb cold starts
  useEffect(() => {
    const warmupBackend = () => {
      fetch(`${API_BASE}/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
    };
    warmupBackend();

    // Keep-alive: ping every 4 minutes
    const keepAlive = setInterval(warmupBackend, 4 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Setting />
          </ProtectedRoute>
        } />
        <Route path="/api-key" element={
          <ProtectedRoute>
            <Key />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notification />
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        } />
        <Route path="/create_student" element={
          <ProtectedRoute>
            <CreateStudent />
          </ProtectedRoute>
        } />
        <Route path="/manage_student" element={
          <ProtectedRoute>
            <ManageStudent />
          </ProtectedRoute>
        } />
        <Route path="/manage_speaking_topic" element={
          <ProtectedRoute>
            <ManageSpeakingTopic />
          </ProtectedRoute>
        } />
        <Route path="/edit_writing_test/:examId" element={
          <ProtectedRoute>
            <EditWritingTest />
          </ProtectedRoute>
        } />
        <Route path="/edit_listening_test/:examId" element={
          <ProtectedRoute>
            <EditListeningTest />
          </ProtectedRoute>
        } />
        <Route path="/edit_reading_test/:examId" element={
          <ProtectedRoute>
            <EditReadingTest />
          </ProtectedRoute>
        } />
        <Route path="/edit-speaking-test/:topicId" element={
          <ProtectedRoute>
            <EditSpeakingTest />
          </ProtectedRoute>
        } />
        <Route path="/create_listening_test" element={
          <ProtectedRoute>
            <CreateListeningTest />
          </ProtectedRoute>
        } />
        <Route path="/create_writing_test" element={
          <ProtectedRoute>
            <CreateWritingTest />
          </ProtectedRoute>
        } />
        <Route path="/create_reading_test" element={
          <ProtectedRoute>
            <CreateReadingTest />
          </ProtectedRoute>
        } />
        <Route path="/create_speaking_test" element={
          <ProtectedRoute>
            <CreateSpeakingTest />
          </ProtectedRoute>
        } />
        <Route path="/manage_test" element={
          <ProtectedRoute>
            <ManageTest />
          </ProtectedRoute>
        } />
        <Route path="/manage_forecast" element={
          <ProtectedRoute>
            <ManageForecast />
          </ProtectedRoute>
        } />

        {/* VIP Package Management Routes */}
        <Route path="/packages" element={
          <ProtectedRoute>
            <VIPPackageManagement />
          </ProtectedRoute>
        } />
        <Route path="/subscriptions" element={
          <ProtectedRoute>
            <SubscriptionsList />
          </ProtectedRoute>
        } />
        <Route path="/pending-transactions" element={
          <ProtectedRoute>
            <PendingTransactions />
          </ProtectedRoute>
        } />

        {/* Dictation Management */}
        <Route path="/dictation" element={
          <ProtectedRoute>
            <DictationManagement />
          </ProtectedRoute>
        } />

        {/* Marketing Email Broadcast */}
        <Route path="/marketing-email" element={
          <ProtectedRoute>
            <MarketingEmail />
          </ProtectedRoute>
        } />

        {/* Part Titles Management */}
        <Route path="/manage_part_titles" element={
          <ProtectedRoute>
            <ManagePartTitles />
          </ProtectedRoute>
        } />

      </Routes>
    </>
  );
}

export default App;
