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

// Team color mapping function for team badges
const getTeamColors = (teamName) => {
  const teamColors = {
    'Chickens': { bg: '#B3E5FC', text: '#0277BD' },     // Light blue
    'Hy2+': { bg: '#C8E6C9', text: '#2E7D32' },         // Soft green  
    'Gooses': { bg: '#FCE4EC', text: '#C2185B' },       // Light pink
    'H2T': { bg: '#FFF3E0', text: '#F57C00' },          // Peach
    '3CE': { bg: '#F3E5F5', text: '#7B1FA2' },          // Lavender
    'The Deans': { bg: '#E0F2F1', text: '#00695C' },    // Mint
    'Ducks': { bg: '#FFF9C4', text: '#F9A825' },        // Pale yellow
  };
  
  return teamColors[teamName] || { bg: '#f0f4ff', text: '#667eea' };
};

const GroupsDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [allMembersByTeam, setAllMembersByTeam] = useState({});

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/activities';

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        console.log('Fetching data from APIs...');

        // Fetch both members and activities data
        const [membersResponse, activitiesResponse] = await Promise.all([
          axios.get('https://apptavn-ynfcnag4xa-uc.a.run.app/members'),
          axios.get(API_ENDPOINT),
        ]);

        console.log('Members API Response:', membersResponse.data);
        console.log('Activities API Response:', activitiesResponse.data);

        // Process members data to get team structure
        const teamMembers = {};
        const allMembersByTeam = {}; // Store detailed member info for the new table
        if (membersResponse.data && Array.isArray(membersResponse.data)) {
          membersResponse.data.forEach((member) => {
            const teamName = member.team || 'No Team';
            const memberName =
              member.webName ||
              `${member.firstname} ${member.lastname}`.trim() ||
              'Unknown Member';

            if (!teamMembers[teamName]) {
              teamMembers[teamName] = new Set();
            }
            teamMembers[teamName].add(memberName);

            // Store detailed member info for the new table
            if (!allMembersByTeam[teamName]) {
              allMembersByTeam[teamName] = [];
            }
            allMembersByTeam[teamName].push({
              name: memberName,
              firstName: member.firstname || '',
              lastName: member.lastname || '',
              webName: member.webName || '',
            });
          });
        }

        // Process activities to extract team data
        const teamData = activitiesResponse.data.reduce((acc, activity) => {
          const teamName = activity.athlete?.team || 'No Team';
          // Use the new date field (date, date_committed, or date_fetch) with fallback to old daymonth
          const dateField =
            activity.date ||
            activity.date_committed ||
            activity.date_fetch ||
            activity.daymonth;
          const parsedDate = parseDateField(dateField);
          const dayMonth = parsedDate?.dayMonth || 'Unknown';

          if (!acc[teamName]) {
            acc[teamName] = {
              name: teamName,
              members: teamMembers[teamName] || new Set(),
              activities: 0,
              totalDistance: 0,
              status: 'Active', // All teams are considered active
              dailyActivities: {},
            };
          }
          acc[teamName].activities += 1;
          acc[teamName].totalDistance += activity.distance || 0;

          // Track daily activities
          if (!acc[teamName].dailyActivities[dayMonth]) {
            acc[teamName].dailyActivities[dayMonth] = {
              dayMonth,
              activities: 0,
              distance: 0,
              members: new Set(),
              formattedDate: parsedDate?.formattedDate || 'Unknown',
            };
          }
          acc[teamName].dailyActivities[dayMonth].activities += 1;
          acc[teamName].dailyActivities[dayMonth].distance +=
            activity.distance || 0;
          acc[teamName].dailyActivities[dayMonth].members.add(
            `${activity.athlete?.firstname} ${activity.athlete?.lastname}`
          );

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
        setAllMembersByTeam(allMembersByTeam);

        // Extract all available days and set current day as default
        const allDays = new Set();
        Object.values(teamData).forEach((team) => {
          Object.keys(team.dailyActivities).forEach((day) => {
            allDays.add(day);
          });
        });

        const sortedDays = Array.from(allDays).sort().reverse(); // Most recent first
        setAvailableDays(sortedDays);

        // Set current day as default (most recent day with data)
        if (sortedDays.length > 0) {
          setSelectedDay(sortedDays[0]);
        }

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
    <div style={{ padding: '0 1rem' }}>
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
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
      <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Teams Table</h3>
          <span className="card-subtitle">All teams and their details</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th title="Number of members in this team">Members</th>
              <th title="Total number of activities completed by this team">
                Activities
              </th>
              <th>Total Distance (km)</th>
              <th title="Team activity status - All teams are currently marked as Active">
                Status
              </th>
              <th title="Average distance per team member in kilometers - calculated as total team distance divided by number of members">
                Distance Rate
              </th>
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
                        team.totalDistance / team.members > 1000
                          ? '#e6fffa'
                          : '#fef5e7',
                      color:
                        team.totalDistance / team.members > 1000
                          ? '#00a085'
                          : '#d69e2e',
                    }}
                  >
                    {(team.totalDistance / team.members / 1000).toFixed(1)}
                    km/member
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Team Members</h3>
          <span className="card-subtitle">All members organized by team</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Members</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(allMembersByTeam)
              .sort()
              .map((teamName) => (
                <tr key={teamName}>
                  <td style={{ fontWeight: '600' }}>{teamName}</td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      {allMembersByTeam[teamName].map((member, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: getTeamColors(teamName).bg,
                            color: getTeamColors(teamName).text,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Daily Team Activity</h3>
          <span className="card-subtitle">
            Team activities for selected day
          </span>
        </div>

        {availableDays.length > 0 && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#2d3748',
              }}
            >
              Select Day:
            </label>
            <select
              value={selectedDay || ''}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                minWidth: '200px',
              }}
            >
              {availableDays.map((day) => {
                const team = teams.find(
                  (t) => t.dailyActivities && t.dailyActivities[day]
                );
                const formattedDate =
                  team?.dailyActivities[day]?.formattedDate || day;
                return (
                  <option key={day} value={day}>
                    {formattedDate}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {selectedDay && (
          <div>
            <h4
              style={{
                marginBottom: '1rem',
                color: '#2d3748',
                fontSize: '1.25rem',
                fontWeight: '600',
              }}
            >
              Teams Active on{' '}
              {teams.find(
                (t) => t.dailyActivities && t.dailyActivities[selectedDay]
              )?.dailyActivities[selectedDay]?.formattedDate || selectedDay}
            </h4>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th title="Number of activities completed by the team on the selected day">
                    Activities
                  </th>
                  <th title="Total distance covered by the team on the selected day">
                    Distance (km)
                  </th>
                  <th title="Number of unique team members who were active on the selected day">
                    Active Members
                  </th>
                  <th title="Average distance per activity for the team on the selected day">
                    Avg Distance (km)
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams
                  .filter(
                    (team) =>
                      team.dailyActivities && team.dailyActivities[selectedDay]
                  )
                  .map((team) => {
                    const dayData = team.dailyActivities[selectedDay];
                    const memberCount = dayData.members
                      ? dayData.members.size
                      : 0;
                    const distanceKm = (dayData.distance / 1000).toFixed(2);
                    const avgDistance =
                      dayData.activities > 0
                        ? (
                            dayData.distance /
                            dayData.activities /
                            1000
                          ).toFixed(2)
                        : '0.00';

                    return (
                      <tr key={team.name}>
                        <td style={{ fontWeight: '600' }}>{team.name}</td>
                        <td>{dayData.activities}</td>
                        <td style={{ fontWeight: '600', color: '#2d3748' }}>
                          {distanceKm} km
                        </td>
                        <td>{memberCount}</td>
                        <td>{avgDistance} km</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {teams.filter(
              (team) =>
                team.dailyActivities && team.dailyActivities[selectedDay]
            ).length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#718096',
                }}
              >
                No team activities found for the selected day.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsDashboard;
