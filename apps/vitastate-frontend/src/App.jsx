import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import UserForm from './components/UserForm';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import NutritionPage from './components/NutritionPage';
import WorkoutsPage from './components/WorkoutsPage';
import SleepPage from './components/SleepPage';
import ProgressPage from './components/ProgressPage';
import DoctorReportPage from './components/DoctorReportPage';
import './App.css'

function App() {
  const [step, setStep] = useState('landing');
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    // Check for Fitbit auth token in URL hash
    const hash = window.location.hash;
    if (hash) {
      // ... (existing token parse logic if any, or backend callback handles it) 
      // Actually, backend handles flow. If we redirected back with token param?
      // Current flow uses backend callback URL. 
      // Let's assume dashboard checks backend or persisting token logic is same as before.
      // Actually, previous logic didn't have hash parsing here, it was relying on 
      // server-side or a simple check. 
      // Wait, did I remove the token check?
      // The previous App.jsx logic for token was:
      // "const queryParams = new URLSearchParams(window.location.search); const tokenParam = queryParams.get('token');"
      // Correct.
      const queryParams = new URLSearchParams(window.location.search);
      const tokenParam = queryParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
        // If we have token, we likely want to be on dashboard
        setStep('dashboard');
        // Clean URL
        window.history.replaceState({}, document.title, "/");
      }
    }

    // Check localStorage
    const savedUser = localStorage.getItem('vitastate_user');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
      if (step === 'landing') setStep('dashboard');
    }
  }, []);

  const handleStart = () => setStep('form');

  const handleFormSubmit = (data) => {
    setUserData(data);
    localStorage.setItem('vitastate_user', JSON.stringify(data));
    setStep('dashboard');
  };

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  const handleDashboardAction = (actionPage) => {
    setActivePage(actionPage);
  };

  const handleLogout = () => {
    localStorage.removeItem('vitastate_user');
    setUserData(null);
    setToken(null);
    setStep('landing');
    setActivePage('dashboard');
  };

  return (
    <div className="app-root">
      {step === 'landing' && <Landing onStart={handleStart} />}

      {step === 'form' && <UserForm onSubmit={handleFormSubmit} />}

      {step === 'dashboard' && (
        <div className="main-layout">
          <Sidebar activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} />
          <main className="main-content">
            {activePage === 'dashboard' && <Dashboard userData={userData} token={token} onNavigate={handleDashboardAction} />}
            {activePage === 'nutrition' && <NutritionPage userData={userData} />}
            {activePage === 'workouts' && <WorkoutsPage userData={userData} />}
            {activePage === 'sleep' && <SleepPage userData={userData} />}
            {activePage === 'progress' && <ProgressPage userData={userData} />}
            {activePage === 'doctor' && <DoctorReportPage userData={userData} />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
