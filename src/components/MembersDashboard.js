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
  AreaChart,
  Area,
} from 'recharts';

const MembersDashboard = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/activities';
  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
  ];

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        console.log('Fetching activities from:', API_ENDPOINT);
        const response = await axios.get(API_ENDPOINT);
        console.log('API Response:', response.data);

        // Process activities to extract member data
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid API response format');
        }

        const memberData = response.data.reduce((acc, activity) => {
          // Add safety checks for activity structure
          if (!activity || !activity.athlete) {
            console.warn(
              'Skipping activity with missing athlete data:',
              activity
            );
            return acc;
          }

          const memberName = `${activity.athlete?.firstname} ${activity.athlete?.lastname}`;
          const teamName = activity.athlete?.team || 'No Team';
          const dayMonth = activity.daymonth || 'Unknown';

          if (!acc[memberName]) {
            acc[memberName] = {
              name: memberName,
              team: teamName,
              activities: 0,
              totalDistance: 0,
              activitiesList: [],
              dailyActivities: {},
            };
          }
          acc[memberName].activities += 1;
          acc[memberName].totalDistance += activity.distance || 0;
          acc[memberName].activitiesList.push(activity);

          // Track daily activities
          if (!acc[memberName].dailyActivities[dayMonth]) {
            acc[memberName].dailyActivities[dayMonth] = {
              dayMonth,
              activities: 0,
              distance: 0,
            };
          }
          acc[memberName].dailyActivities[dayMonth].activities += 1;
          acc[memberName].dailyActivities[dayMonth].distance +=
            activity.distance || 0;

          return acc;
        }, {});

        console.log('Processed member data:', memberData);

        // Convert to array and add calculated fields
        const formattedMembers = Object.values(memberData).map(
          (member, index) => ({
            id: index + 1,
            name: member.name,
            team: member.team,
            activities: member.activities,
            totalDistance:
              Math.round((member.totalDistance / 1000) * 100) / 100,
            averageDistance: Math.round(
              member.totalDistance / member.activities
            ),
            status: 'Active', // All members are considered active
            joinDate: '2024-01-01', // Default date since not available in API
          })
        );

        console.log('Formatted members:', formattedMembers);

        setMembers(formattedMembers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(`Failed to fetch member data: ${err.message}`);
        setLoading(false);
        // Set empty members array as fallback
        setMembers([]);
      }
    };

    fetchMembers();
  }, []);

  // Process data for charts
  const memberStats = members.reduce(
    (acc, member) => {
      acc.totalMembers += 1;
      acc.totalActivities += member.activities;
      acc.totalDistance += member.totalDistance;
      acc.activeMembers += member.status === 'Active' ? 1 : 0;
      acc.inactiveMembers += member.status === 'Inactive' ? 1 : 0;
      return acc;
    },
    {
      totalMembers: 0,
      totalActivities: 0,
      totalDistance: 0,
      activeMembers: 0,
      inactiveMembers: 0,
    }
  );

  const teamDistribution = members.reduce((acc, member) => {
    acc[member.team] = (acc[member.team] || 0) + 1;
    return acc;
  }, {});

  const teamChartData = Object.entries(teamDistribution).map(
    ([team, count]) => ({
      team: team.length > 15 ? team.substring(0, 15) + '...' : team,
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
      distance: member.totalDistance,
    }))
    .sort((a, b) => b.activities - a.activities)
    .slice(0, 6); // Top 6 members

  const distanceDistribution = members
    .map((member) => ({
      name: member.name.split(' ')[0], // First name only for chart
      distance: member.totalDistance,
    }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 6); // Top 6 members

  const averageActivities =
    memberStats.totalMembers > 0
      ? Math.round(memberStats.totalActivities / memberStats.totalMembers)
      : 0;

  const averageDistance =
    memberStats.totalMembers > 0
      ? Math.round(
          (memberStats.totalDistance / memberStats.totalMembers) * 100
        ) / 100
      : 0;

  // Process data for team member breakdown
  const teamMemberBreakdown = members.reduce((acc, member) => {
    if (!member || !member.team) {
      console.warn('Skipping member with missing team data:', member);
      return acc;
    }

    const teamName = member.team;
    if (!acc[teamName]) {
      acc[teamName] = {
        teamName,
        members: [],
        totalActivities: 0,
        totalDistance: 0,
        memberCount: 0,
      };
    }
    acc[teamName].members.push(member);
    acc[teamName].totalActivities += member.activities || 0;
    acc[teamName].totalDistance += member.totalDistance || 0;
    acc[teamName].memberCount += 1;
    return acc;
  }, {});

  const teamBreakdownData = Object.values(teamMemberBreakdown).map((team) => ({
    ...team,
    averageActivities:
      team.memberCount > 0
        ? Math.round(team.totalActivities / team.memberCount)
        : 0,
    averageDistance:
      team.memberCount > 0
        ? Math.round((team.totalDistance / team.memberCount) * 100) / 100
        : 0,
  }));

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
          <div className="stat-value">{averageDistance.toFixed(2)}km</div>
          <div className="stat-label">Avg Distance/Member</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3 className="chart-title">Members by Team</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
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
          <h3 className="chart-title">Top Distance Members</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} km`, 'Total Distance']}
              />
              <Bar dataKey="distance" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Team Member Breakdown</h3>
          <span className="card-subtitle">
            Members organized by team with team statistics
          </span>
        </div>
        {teamBreakdownData.length > 0 ? (
          teamBreakdownData.map((team) => (
            <div key={team.teamName} style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: '#2d3748',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                  }}
                >
                  {team.teamName}
                </h4>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#667eea',
                      }}
                    >
                      {team.memberCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Members
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#00C49F',
                      }}
                    >
                      {team.totalActivities}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Activities
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#FFBB28',
                      }}
                    >
                      {team.totalDistance.toFixed(2)}km
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Total Distance
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#8884D8',
                      }}
                    >
                      {team.averageDistance.toFixed(2)}km
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Avg Distance
                    </div>
                  </div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Activities</th>
                    <th>Total Distance (km)</th>
                    <th>Avg Distance (km)</th>
                    <th>Activity Level</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((member) => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: '600' }}>{member.name}</td>
                      <td>{member.activities}</td>
                      <td style={{ fontWeight: '600', color: '#2d3748' }}>
                        {member.totalDistance.toFixed(2)} km
                      </td>
                      <td>
                        {Math.round((member.averageDistance / 1000) * 100) /
                          100}{' '}
                        km
                      </td>
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
          ))
        ) : (
          <div
            style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}
          >
            No team data available
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Daily Member Activity</h3>
          <span className="card-subtitle">
            Member activities organized by day
          </span>
        </div>
        {members.map((member) => {
          const dailyData = Object.values(member.dailyActivities || {})
            .sort((a, b) => b.distance - a.distance)
            .map((day) => ({
              ...day,
              formattedDate: day.dayMonth
                ? `${day.dayMonth.substring(2, 4)}/${day.dayMonth.substring(
                    0,
                    2
                  )}`
                : 'Unknown',
              distanceKm: (day.distance / 1000).toFixed(2),
            }));

          if (dailyData.length === 0) return null;

          return (
            <div key={member.id} style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: '#2d3748',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                  }}
                >
                  {member.name} - Daily Activities
                </h4>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#667eea',
                      }}
                    >
                      {dailyData.length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Active Days
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#00C49F',
                      }}
                    >
                      {member.activities}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Total Activities
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#FFBB28',
                      }}
                    >
                      {member.totalDistance.toFixed(2)}km
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Total Distance
                    </div>
                  </div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activities</th>
                    <th>Distance (km)</th>
                    <th>Avg Distance (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((day) => (
                    <tr key={day.dayMonth}>
                      <td style={{ fontWeight: '600' }}>{day.formattedDate}</td>
                      <td>{day.activities}</td>
                      <td style={{ fontWeight: '600', color: '#2d3748' }}>
                        {day.distanceKm} km
                      </td>
                      <td>
                        {day.activities > 0
                          ? (day.distance / day.activities / 1000).toFixed(2)
                          : '0.00'}{' '}
                        km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">All Members Table</h3>
          <span className="card-subtitle">
            Complete list of all members and their activity details
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Team</th>
              <th>Activities</th>
              <th>Total Distance (km)</th>
              <th>Avg Distance (km)</th>
              <th>Status</th>
              <th>Activity Level</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td style={{ fontWeight: '600' }}>{member.name}</td>
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
                    {member.team}
                  </span>
                </td>
                <td>{member.activities}</td>
                <td style={{ fontWeight: '600', color: '#2d3748' }}>
                  {member.totalDistance.toFixed(2)} km
                </td>
                <td>{(member.averageDistance / 1000).toFixed(2)} km</td>
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
