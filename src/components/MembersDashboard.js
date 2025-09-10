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

        // Calculate total days with activities for each member
        const memberDailyActivities = {};
        if (activitiesResponse.data && Array.isArray(activitiesResponse.data)) {
          activitiesResponse.data.forEach((activity) => {
            if (activity.athlete) {
              const firstName = activity.athlete?.firstname || '';
              const lastName = activity.athlete?.lastname || '';
              const fullName = `${firstName} ${lastName}`.trim();
              const webName = activity.athlete?.webName || '';

              const possibleNames = [fullName, webName].filter((name) => name);

              possibleNames.forEach((name) => {
                if (!memberDailyActivities[name]) {
                  memberDailyActivities[name] = new Set();
                }

                // Use the new date field (date, date_committed, or date_fetch) with fallback to old daymonth
                const dateField =
                  activity.date ||
                  activity.date_committed ||
                  activity.date_fetch ||
                  activity.daymonth;
                const parsedDate = parseDateField(dateField);
                const dayMonth = parsedDate?.dayMonth || 'Unknown';

                memberDailyActivities[name].add(dayMonth);
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
          let activeDays = 0;

          // Find the first matching name in activity data
          for (const name of possibleNames) {
            if (memberActivityData[name]) {
              activityData = memberActivityData[name];
            }
            if (memberDailyActivities[name]) {
              activeDays = memberDailyActivities[name].size;
            }
            if (activityData.activities > 0 && activeDays > 0) {
              break;
            }
          }

          // Calculate activities per day for activity level
          const activitiesPerDay =
            activeDays > 0 ? activityData.activities / activeDays : 0;
          let activityLevel = 'Low';
          if (activitiesPerDay >= 3) {
            activityLevel = 'High';
          } else if (activitiesPerDay >= 1) {
            activityLevel = 'Medium';
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
            status: 'Active',
            joinDate: '2024-01-01', // Default date
            activityLevel: activityLevel,
            activeDays: activeDays,
            activitiesPerDay: Math.round(activitiesPerDay * 100) / 100,
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
              <th title="Activity level based on activities per day: High (3+), Medium (1+), Low (&lt;1)">
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
                        member.activityLevel === 'High'
                          ? '#e6fffa'
                          : member.activityLevel === 'Medium'
                          ? '#fef5e7'
                          : '#fed7d7',
                      color:
                        member.activityLevel === 'High'
                          ? '#00a085'
                          : member.activityLevel === 'Medium'
                          ? '#d69e2e'
                          : '#c53030',
                    }}
                  >
                    {member.activityLevel}
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
