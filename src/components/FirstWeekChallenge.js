import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FirstWeekChallenge = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT =
    'https://apptavn-ynfcnag4xa-uc.a.run.app/activities?period=firstWeek';

  useEffect(() => {
    const fetchFirstWeekActivities = async () => {
      try {
        setLoading(true);
        console.log('Fetching first week activities from:', API_ENDPOINT);
        const response = await axios.get(API_ENDPOINT);
        console.log('First Week API Response:', response.data);
        setActivities(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching first week activities:', err);
        setError('Failed to fetch first week activities');
        setLoading(false);
      }
    };

    fetchFirstWeekActivities();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div>Loading first week challenge data...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div style={{ padding: '0 1rem' }}>
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">First 7-Day Challenge</h3>
          <span className="card-subtitle">
            Activities from the first week of the challenge
          </span>
        </div>
        <div style={{ padding: '1rem' }}>
          <p>API Response logged to console. Check browser console for data.</p>
          <p>Total activities: {activities.length}</p>
        </div>
      </div>
    </div>
  );
};

export default FirstWeekChallenge;
