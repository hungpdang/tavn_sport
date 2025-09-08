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
} from 'recharts';

// Utility function to parse the new date format
const parseDateField = (dateString) => {
  if (!dateString) return null;

  // Clean up the date string by removing newlines and extra spaces
  const cleanDateString = dateString.replace(/\n\s+/g, ' ').trim();

  try {
    // Handle the specific format: "Mon, 08 Sep, 2025 - 12:56:34"
    // Convert to a more standard format that Date can parse
    let dateToParse = cleanDateString;

    // If it contains the format "Mon, 08 Sep, 2025 - 12:56:34"
    if (dateToParse.includes(' - ')) {
      // Replace " - " with " " to make it "Mon, 08 Sep, 2025 12:56:34"
      dateToParse = dateToParse.replace(' - ', ' ');
    }

    const date = new Date(dateToParse);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date parsed:', dateString, '->', dateToParse);
      return null;
    }

    // Extract day and month in MM/DD format
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      dayMonth: `${month}${day}`, // Keep original format for compatibility
      formattedDate: `${month}/${day}`,
      fullDate: date,
    };
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

const MembersDashboard = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/activities';

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
          // Use the new date field (date, date_committed, or date_fetch) with fallback to old daymonth
          const dateField =
            activity.date ||
            activity.date_committed ||
            activity.date_fetch ||
            activity.daymonth;
          const parsedDate = parseDateField(dateField);
          const dayMonth = parsedDate?.dayMonth || 'Unknown';

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
              formattedDate: parsedDate?.formattedDate || 'Unknown',
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
    <div style={{ padding: '0 1rem' }}>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
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

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
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
              <th title="Total number of activities completed by this member">
                Activities
              </th>
              <th>Total Distance (km)</th>
              <th title="Average distance per activity for this member">
                Avg Distance (km)
              </th>
              <th title="Member activity status - All members are currently marked as Active">
                Status
              </th>
              <th title="Activity level based on total activities: High (10+), Medium (5-9), Low (0-4)">
                Activity Level
              </th>
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
