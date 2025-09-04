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
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from 'recharts';

const GroupsDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/activities';

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        console.log('Fetching activities from:', API_ENDPOINT);
        const response = await axios.get(API_ENDPOINT);
        console.log('API Response:', response.data);

        // Process activities to extract team data
        const teamData = response.data.reduce((acc, activity) => {
          const teamName = activity.athlete?.team || 'No Team';
          if (!acc[teamName]) {
            acc[teamName] = {
              name: teamName,
              members: new Set(),
              activities: 0,
              totalDistance: 0,
              status: 'Active', // All teams are considered active
            };
          }
          acc[teamName].members.add(
            `${activity.athlete?.firstname} ${activity.athlete?.lastname}`
          );
          acc[teamName].activities += 1;
          acc[teamName].totalDistance += activity.distance || 0;
          return acc;
        }, {});

        // Convert Set to count and format data
        const formattedTeams = Object.values(teamData).map((team) => ({
          ...team,
          members: team.members.size,
          totalDistanceKm: Math.round((team.totalDistance / 1000) * 100) / 100,
          totalDistance: team.totalDistance, // Keep original distance in meters for calculations
        }));

        setTeams(formattedTeams);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to fetch team data');
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Process data for charts
  const teamStats = teams.reduce(
    (acc, team) => {
      acc.totalTeams += 1;
      acc.totalMembers += team.members;
      acc.totalActivities += team.activities;
      acc.totalDistance += team.totalDistance;
      acc.activeTeams += team.status === 'Active' ? 1 : 0;
      return acc;
    },
    {
      totalTeams: 0,
      totalMembers: 0,
      totalActivities: 0,
      totalDistance: 0,
      activeTeams: 0,
    }
  );

  const chartData = teams.map((team) => ({
    name:
      team.name.length > 10 ? team.name.substring(0, 10) + '...' : team.name,
    members: team.members,
    activities: team.activities,
    distance: team.totalDistanceKm,
  }));

  const scatterData = teams.map((team) => ({
    x: team.members,
    y: team.activities,
    name: team.name,
  }));

  const statusData = teams.reduce((acc, team) => {
    acc[team.status] = (acc[team.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    status,
    count,
  }));

  if (loading) {
    return (
      <div className="loading">
        <div>Loading teams...</div>
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
          <div className="stat-value">{teamStats.totalTeams}</div>
          <div className="stat-label">Total Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{teamStats.activeTeams}</div>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{teamStats.totalMembers}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {(teamStats.totalDistance / 1000).toFixed(2)}km
          </div>
          <div className="stat-label">Total Distance</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Team Size vs Activities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Members" />
              <YAxis dataKey="y" name="Activities" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey="y" fill="#667eea" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Team Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Members per Team</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="members" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Distance per Team</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} km`, 'Total Distance']}
              />
              <Bar dataKey="distance" fill="#8884D8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Teams Table</h3>
          <span className="card-subtitle">All teams and their details</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Members</th>
              <th>Activities</th>
              <th>Total Distance (km)</th>
              <th>Status</th>
              <th>Activity Rate</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.name}>
                <td style={{ fontWeight: '600' }}>{team.name}</td>
                <td>{team.members}</td>
                <td>{team.activities}</td>
                <td style={{ fontWeight: '600', color: '#2d3748' }}>
                  {team.totalDistanceKm.toFixed(2)} km
                </td>
                <td>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        team.status === 'Active' ? '#e6fffa' : '#fed7d7',
                      color: team.status === 'Active' ? '#00a085' : '#c53030',
                    }}
                  >
                    {team.status}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        team.activities / team.members > 0.5
                          ? '#e6fffa'
                          : '#fef5e7',
                      color:
                        team.activities / team.members > 0.5
                          ? '#00a085'
                          : '#d69e2e',
                    }}
                  >
                    {(team.activities / team.members).toFixed(1)}/member
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupsDashboard;
