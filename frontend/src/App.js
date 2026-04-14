import React, { useState, useCallback } from 'react';
import './index.css';
import './App.css';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import UserForm from './components/UserForm';
import DecisionModeSelector from './components/DecisionModeSelector';
import ResultDashboard from './components/ResultDashboard';
import LoadingScreen from './components/LoadingScreen';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const STEPS = ['Add Members', 'Choose Mode', 'Results'];

export default function App() {
  const [step, setStep] = useState(0);
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState('democracy');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleResolve = useCallback(async () => {
    if (users.length === 0) {
      showToast('Please add at least one user.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/resolve`, { users, mode, history });
      setResult(data);
      // Save score history for fairness rotation
      if (data.selected) {
        const scoreMap = {};
        Object.entries(data.selected.userScores).forEach(([id, score]) => {
          scoreMap[id] = score;
        });
        setHistory(prev => [...prev.slice(-4), scoreMap]);
      }
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to connect to backend. Is the server running?';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [users, mode, history, showToast]);

  const handleSeedData = useCallback(async () => {
    try {
      await axios.post(`${API}/seed`);
      showToast('✅ Restaurant data seeded!', 'success');
    } catch {
      showToast('Failed to seed data. Is the backend running?', 'error');
    }
  }, [showToast]);

  const reset = () => {
    setStep(0);
    setResult(null);
    setUsers([]);
    setMode('democracy');
  };

  return (
    <div className="app-root">
      {/* Ambient background blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      <Header onSeed={handleSeedData} />

      <main className="main-content">
        <StepIndicator steps={STEPS} current={step} />

        {loading && <LoadingScreen />}

        {!loading && step === 0 && (
          <UserForm
            users={users}
            setUsers={setUsers}
            onNext={() => setStep(1)}
          />
        )}

        {!loading && step === 1 && (
          <DecisionModeSelector
            mode={mode}
            setMode={setMode}
            users={users}
            onBack={() => setStep(0)}
            onResolve={handleResolve}
          />
        )}

        {!loading && step === 2 && result && (
          <ResultDashboard
            result={result}
            onReset={reset}
          />
        )}
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
