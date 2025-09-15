import React, { useState } from 'react';
import './App.css';
import ActivitiesDashboard from './components/ActivitiesDashboard';
import GroupsDashboard from './components/GroupsDashboard';
import MembersDashboard from './components/MembersDashboard';
import FirstWeekChallenge from './components/FirstWeekChallenge';

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
      case 'firstWeek':
        return <FirstWeekChallenge />;
      default:
        return <ActivitiesDashboard />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-logo-container">
          <img
            src="https://www.tecalliance.net/wp-content/uploads/TecAlliance-Logo-Web.svg"
            alt="TecAlliance"
            className="header-logo"
          />
        </div>
        <div className="header-top">
          <h1>Walking Challenge Dashboard</h1>
        </div>
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
          <button
            className={`nav-tab ${activeTab === 'firstWeek' ? 'active' : ''}`}
            onClick={() => setActiveTab('firstWeek')}
          >
            First 7-day Challenge
          </button>
        </nav>
      </header>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
