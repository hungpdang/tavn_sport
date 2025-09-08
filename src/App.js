import React, { useState } from 'react';
import './App.css';
import ActivitiesDashboard from './components/ActivitiesDashboard';
import GroupsDashboard from './components/GroupsDashboard';
import MembersDashboard from './components/MembersDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('activities');

  const renderContent = () => {
    switch (activeTab) {
      case 'activities':
        return <ActivitiesDashboard />;
      case 'groups':
        return <GroupsDashboard />;
      case 'members':
        return <MembersDashboard />;
      default:
        return <ActivitiesDashboard />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Walking Challenge Dashboard</h1>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Overall
          </button>
          <button
            className={`nav-tab ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Teams
          </button>
          <button
            className={`nav-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Individuals
          </button>
        </nav>
      </header>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
