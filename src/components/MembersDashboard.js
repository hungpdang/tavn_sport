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

const MembersDashboard = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/members';

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        console.log('Fetching members from:', API_ENDPOINT);
        const membersResponse = await axios.get(API_ENDPOINT);
        console.log('Members API Response:', membersResponse.data);

        // Also fetch activities to get activity data for each member
        const activitiesResponse = await axios.get(
          'https://apptavn-ynfcnag4xa-uc.a.run.app/activities'
        );
        console.log('Activities API Response:', activitiesResponse.data);

        // Process member data directly from the members API
        if (!membersResponse.data || !Array.isArray(membersResponse.data)) {
          throw new Error('Invalid members API response format');
        }

        // Process activities to get member activity data
        const memberActivityData = {};
        if (activitiesResponse.data && Array.isArray(activitiesResponse.data)) {
          activitiesResponse.data.forEach((activity) => {
            if (activity.athlete) {
              // Create multiple possible name formats for matching
              const firstName = activity.athlete?.firstname || '';
              const lastName = activity.athlete?.lastname || '';
              const fullName = `${firstName} ${lastName}`.trim();
              const webName = activity.athlete?.webName || '';

              // Try to match with different name formats
              const possibleNames = [fullName, webName].filter((name) => name);

              possibleNames.forEach((name) => {
                if (!memberActivityData[name]) {
                  memberActivityData[name] = {
                    activities: 0,
                    totalDistance: 0,
                  };
                }
                memberActivityData[name].activities += 1;
                memberActivityData[name].totalDistance +=
                  activity.distance || 0;
              });
            }
          });
        }

        // Format members data with activity data merged in
        const formattedMembers = membersResponse.data.map((member, index) => {
          const memberName =
            member.webName ||
            `${member.firstname} ${member.lastname}`.trim() ||
            'Unknown Member';

          // Try to find activity data by matching different name formats
          const possibleNames = [
            memberName,
            member.webName,
            `${member.firstname} ${member.lastname}`.trim(),
            `${member.lastname} ${member.firstname}`.trim(), // Try reverse order
          ].filter((name) => name);

          let activityData = { activities: 0, totalDistance: 0 };

          // Find the first matching name in activity data
          for (const name of possibleNames) {
            if (memberActivityData[name]) {
              activityData = memberActivityData[name];
              break;
            }
          }

          return {
            id: index + 1,
            name: memberName,
            team: member.team || 'No Team',
            activities: activityData.activities,
            totalDistance:
              Math.round((activityData.totalDistance / 1000) * 100) / 100,
            averageDistance:
              activityData.activities > 0
                ? Math.round(
                    activityData.totalDistance / activityData.activities
                  )
                : 0,
            status: 'Active', // All members are considered active
            joinDate: '2024-01-01', // Default date since not available in API
          };
        });

        console.log('Member activity data:', memberActivityData);
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
