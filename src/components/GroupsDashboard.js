import React, { useState, useEffect } from 'react';
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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockGroups = [
    {
      id: 1,
      name: 'Football Team A',
      members: 22,
      activities: 15,
      createdDate: '2024-01-01',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Basketball Squad',
      members: 12,
      activities: 8,
      createdDate: '2024-01-05',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Swimming Club',
      members: 18,
      activities: 12,
      createdDate: '2024-01-10',
      status: 'Active',
    },
    {
      id: 4,
      name: 'Tennis Group',
      members: 8,
      activities: 6,
      createdDate: '2024-01-15',
      status: 'Inactive',
    },
    {
      id: 5,
      name: 'Volleyball Team',
      members: 14,
      activities: 10,
      createdDate: '2024-01-20',
      status: 'Active',
    },
    {
      id: 6,
      name: 'Running Club',
      members: 25,
      activities: 20,
      createdDate: '2024-01-25',
      status: 'Active',
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setGroups(mockGroups);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to fetch groups');
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Process data for charts
  const groupStats = groups.reduce(
    (acc, group) => {
      acc.totalGroups += 1;
      acc.totalMembers += group.members;
      acc.totalActivities += group.activities;
      acc.activeGroups += group.status === 'Active' ? 1 : 0;
      return acc;
    },
    { totalGroups: 0, totalMembers: 0, totalActivities: 0, activeGroups: 0 }
  );

  const chartData = groups.map((group) => ({
    name:
      group.name.length > 10 ? group.name.substring(0, 10) + '...' : group.name,
    members: group.members,
    activities: group.activities,
  }));

  const scatterData = groups.map((group) => ({
    x: group.members,
    y: group.activities,
    name: group.name,
  }));

  const statusData = groups.reduce((acc, group) => {
    acc[group.status] = (acc[group.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    status,
    count,
  }));

  if (loading) {
    return (
      <div className="loading">
        <div>Loading groups...</div>
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
          <div className="stat-value">{groupStats.totalGroups}</div>
          <div className="stat-label">Total Groups</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{groupStats.activeGroups}</div>
          <div className="stat-label">Active Groups</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{groupStats.totalMembers}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{groupStats.totalActivities}</div>
          <div className="stat-label">Total Activities</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Group Size vs Activities</h3>
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
          <h3 className="chart-title">Group Status Distribution</h3>
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
          <h3 className="chart-title">Members per Group</h3>
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
          <h3 className="chart-title">Activities per Group</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="activities"
                stroke="#8884D8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Groups Table</h3>
          <span className="card-subtitle">All groups and their details</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Members</th>
              <th>Activities</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Activity Rate</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td style={{ fontWeight: '600' }}>{group.name}</td>
                <td>{group.members}</td>
                <td>{group.activities}</td>
                <td>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        group.status === 'Active' ? '#e6fffa' : '#fed7d7',
                      color: group.status === 'Active' ? '#00a085' : '#c53030',
                    }}
                  >
                    {group.status}
                  </span>
                </td>
                <td>{group.createdDate}</td>
                <td>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        group.activities / group.members > 0.5
                          ? '#e6fffa'
                          : '#fef5e7',
                      color:
                        group.activities / group.members > 0.5
                          ? '#00a085'
                          : '#d69e2e',
                    }}
                  >
                    {(group.activities / group.members).toFixed(1)}/member
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
