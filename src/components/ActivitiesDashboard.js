import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const ActivitiesDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/activities';
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        console.log('Fetching activities from:', API_ENDPOINT);
        const response = await axios.get(API_ENDPOINT);
        console.log('API Response:', response.data);
        setActivities(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to fetch activities');
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Process data for athlete distance leaderboard
  const athleteDistances = activities.reduce((acc, activity) => {
    const athleteName = `${activity.athlete?.firstname} ${activity.athlete?.lastname}`;
    if (!acc[athleteName]) {
      acc[athleteName] = {
        name: athleteName,
        totalDistance: 0,
        activityCount: 0,
        activities: [],
      };
    }
    acc[athleteName].totalDistance += activity.distance || 0;
    acc[athleteName].activityCount += 1;
    acc[athleteName].activities.push(activity);
    return acc;
  }, {});

  // Sort athletes by total distance (descending)
  const leaderboardData = Object.values(athleteDistances)
    .sort((a, b) => b.totalDistance - a.totalDistance)
    .map((athlete, index) => ({
      ...athlete,
      rank: index + 1,
      totalDistanceKm: Math.round((athlete.totalDistance / 1000) * 100) / 100, // Convert to km with 2 decimal places
      averageDistance: Math.round(
        athlete.totalDistance / athlete.activityCount
      ),
    }));

  // Calculate statistics based on actual API data
  const totalActivities = activities.length;
  const totalDistance = activities.reduce(
    (sum, activity) => sum + (activity.distance || 0),
    0
  );
  const totalAthletes = Object.keys(athleteDistances).length;
  const averageDistancePerAthlete =
    totalAthletes > 0
      ? Math.round((totalDistance / totalAthletes / 1000) * 100) / 100
      : 0;

  if (loading) {
    return (
      <div className="loading">
        <div>Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalAthletes}</div>
          <div className="stat-label">Total Athletes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(totalDistance / 1000)}km</div>
          <div className="stat-label">Total Distance</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalActivities}</div>
          <div className="stat-label">Total Activities</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{averageDistancePerAthlete}km</div>
          <div className="stat-label">Avg Distance/Athlete</div>
        </div>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Total Distance by Athlete</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={leaderboardData.map((athlete) => ({
              name: athlete.name.split(' ')[0], // First name only for chart
              totalDistance: athlete.totalDistanceKm,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} km`, 'Total Distance']} />
            <Bar dataKey="totalDistance" fill="#00C49F" name="Total Distance" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Distance Leaderboard</h3>
          <span className="card-subtitle">
            Athletes ranked by total distance covered
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Athlete</th>
              <th>Total Distance (km)</th>
              <th>Activities</th>
              <th>Avg Distance (km)</th>
              <th>Best Activity</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((athlete) => {
              const bestActivity = athlete.activities.reduce((best, current) =>
                (current.distance || 0) > (best.distance || 0) ? current : best
              );
              return (
                <tr key={athlete.name}>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor:
                          athlete.rank === 1
                            ? '#FFD700'
                            : athlete.rank === 2
                            ? '#C0C0C0'
                            : athlete.rank === 3
                            ? '#CD7F32'
                            : '#f0f4ff',
                        color: athlete.rank <= 3 ? 'white' : '#667eea',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                      }}
                    >
                      {athlete.rank}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{athlete.name}</td>
                  <td style={{ fontWeight: '600', color: '#2d3748' }}>
                    {athlete.totalDistanceKm} km
                  </td>
                  <td>{athlete.activityCount}</td>
                  <td>
                    {Math.round((athlete.averageDistance / 1000) * 100) / 100}{' '}
                    km
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: '#f0f4ff',
                        color: '#667eea',
                      }}
                    >
                      {Math.round(bestActivity.distance || 0)}m
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivitiesDashboard;
