import React, { useState, useEffect } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';

const MembersDashboard = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockMembers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      group: 'Football Team A',
      joinDate: '2024-01-01',
      activities: 12,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      group: 'Basketball Squad',
      joinDate: '2024-01-05',
      activities: 8,
      status: 'Active',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      group: 'Swimming Club',
      joinDate: '2024-01-10',
      activities: 15,
      status: 'Active',
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      group: 'Tennis Group',
      joinDate: '2024-01-15',
      activities: 6,
      status: 'Inactive',
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david@example.com',
      group: 'Volleyball Team',
      joinDate: '2024-01-20',
      activities: 10,
      status: 'Active',
    },
    {
      id: 6,
      name: 'Lisa Davis',
      email: 'lisa@example.com',
      group: 'Running Club',
      joinDate: '2024-01-25',
      activities: 18,
      status: 'Active',
    },
    {
      id: 7,
      name: 'Tom Anderson',
      email: 'tom@example.com',
      group: 'Football Team A',
      joinDate: '2024-01-30',
      activities: 5,
      status: 'Active',
    },
    {
      id: 8,
      name: 'Emma Taylor',
      email: 'emma@example.com',
      group: 'Swimming Club',
      joinDate: '2024-02-01',
      activities: 9,
      status: 'Active',
    },
  ];

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
  ];

  useEffect(() => {
    // Simulate API call
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setMembers(mockMembers);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to fetch members');
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Process data for charts
  const memberStats = members.reduce(
    (acc, member) => {
      acc.totalMembers += 1;
      acc.totalActivities += member.activities;
      acc.activeMembers += member.status === 'Active' ? 1 : 0;
      acc.inactiveMembers += member.status === 'Inactive' ? 1 : 0;
      return acc;
    },
    {
      totalMembers: 0,
      totalActivities: 0,
      activeMembers: 0,
      inactiveMembers: 0,
    }
  );

  const groupDistribution = members.reduce((acc, member) => {
    acc[member.group] = (acc[member.group] || 0) + 1;
    return acc;
  }, {});

  const groupChartData = Object.entries(groupDistribution).map(
    ([group, count]) => ({
      group: group.length > 15 ? group.substring(0, 15) + '...' : group,
      members: count,
    })
  );

  const statusData = [
    { name: 'Active', value: memberStats.activeMembers, color: '#00C49F' },
    { name: 'Inactive', value: memberStats.inactiveMembers, color: '#FF8042' },
  ];

  const activityDistribution = members
    .map((member) => ({
      name: member.name.split(' ')[0], // First name only for chart
      activities: member.activities,
    }))
    .sort((a, b) => b.activities - a.activities)
    .slice(0, 6); // Top 6 members

  const monthlyJoins = members.reduce((acc, member) => {
    const month = member.joinDate.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyData = Object.entries(monthlyJoins)
    .map(([month, count]) => ({
      month,
      joins: count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const averageActivities =
    memberStats.totalMembers > 0
      ? Math.round(memberStats.totalActivities / memberStats.totalMembers)
      : 0;

  if (loading) {
    return (
      <div className="loading">
        <div>Loading members...</div>
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
          <div className="stat-value">{memberStats.totalMembers}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{memberStats.activeMembers}</div>
          <div className="stat-label">Active Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{averageActivities}</div>
          <div className="stat-label">Avg Activities/Member</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {Object.keys(groupDistribution).length}
          </div>
          <div className="stat-label">Groups Represented</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Members by Group</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="members" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Member Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Top Active Members</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="activities" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Monthly Member Joins</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="joins"
                stroke="#8884D8"
                fill="#8884D8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Members Table</h3>
          <span className="card-subtitle">
            All members and their activity details
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Group</th>
              <th>Activities</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Activity Level</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td style={{ fontWeight: '600' }}>{member.name}</td>
                <td>{member.email}</td>
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
                    {member.group}
                  </span>
                </td>
                <td>{member.activities}</td>
                <td>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        member.status === 'Active' ? '#e6fffa' : '#fed7d7',
                      color: member.status === 'Active' ? '#00a085' : '#c53030',
                    }}
                  >
                    {member.status}
                  </span>
                </td>
                <td>{member.joinDate}</td>
                <td>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        member.activities >= 10
                          ? '#e6fffa'
                          : member.activities >= 5
                          ? '#fef5e7'
                          : '#fed7d7',
                      color:
                        member.activities >= 10
                          ? '#00a085'
                          : member.activities >= 5
                          ? '#d69e2e'
                          : '#c53030',
                    }}
                  >
                    {member.activities >= 10
                      ? 'High'
                      : member.activities >= 5
                      ? 'Medium'
                      : 'Low'}
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

export default MembersDashboard;
