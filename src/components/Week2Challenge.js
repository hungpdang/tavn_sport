import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Utility function to parse the new date format
const parseDateField = (dateString) => {
  if (!dateString) return null;

  // Clean up the date string by removing newlines and extra spaces
  const cleanDateString = dateString.replace(/\n\s+/g, ' ').trim();

  try {
    let dateToParse = cleanDateString;

    if (dateToParse.includes(' - ')) {
      dateToParse = dateToParse.replace(' - ', ' ');
    }

    const date = new Date(dateToParse);

    if (isNaN(date.getTime())) {
      console.warn('Invalid date parsed:', dateString, '->', dateToParse);
      return null;
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      dayMonth: `${month}${day}`,
      formattedDate: `${month}/${day}`,
      fullDate: date,
    };
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

// Team color mapping function
const getTeamColors = (teamName) => {
  const teamColors = {
    Chickens: { bg: '#B3E5FC', text: '#0277BD' }, // Light blue
    'Hy2+': { bg: '#C8E6C9', text: '#2E7D32' }, // Soft green
    Gooses: { bg: '#FCE4EC', text: '#C2185B' }, // Light pink
    H2T: { bg: '#FFF3E0', text: '#F57C00' }, // Peach
    '3CE': { bg: '#F3E5F5', text: '#7B1FA2' }, // Lavender
    'The Doans': { bg: '#E0F2F1', text: '#00695C' }, // Mint
    Ducks: { bg: '#FFF9C4', text: '#F9A825' }, // Pale yellow
  };

  return teamColors[teamName] || { bg: '#f0f4ff', text: '#667eea' };
};

const Week2Challenge = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAthletes, setExpandedAthletes] = useState(new Set());
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  const API_ENDPOINT =
    'https://apptavn-ynfcnag4xa-uc.a.run.app/activities?period=secondWeek';

  useEffect(() => {
    const fetchSecondWeekActivities = async () => {
      try {
        setLoading(true);
        console.log('Fetching second week activities from:', API_ENDPOINT);
        const response = await axios.get(API_ENDPOINT);
        console.log('Second Week API Response:', response.data);

        // Process the data to calculate capped distances
        const processedAthletes = response.data.map((athleteData) => {
          const { athlete_name, team, activities } = athleteData;

          // Calculate daily distances with 10km cap
          const dailyDistances = {};
          let totalDistance = 0;
          let cappedDistance = 0;

          activities.forEach((activity) => {
            const dateField = activity.date || activity.date_fetch;
            const parsedDate = parseDateField(dateField);
            const dayMonth = parsedDate?.dayMonth || 'Unknown';

            // Initialize daily distance tracking for this day
            if (!dailyDistances[dayMonth]) {
              dailyDistances[dayMonth] = 0;
            }

            const activityDistance = activity.distance || 0;
            const currentDailyDistance = dailyDistances[dayMonth];
            const maxDailyDistance = 10000; // 10km in meters

            // Calculate how much distance can be added today (considering the 10km daily cap)
            const remainingDailyCapacity = Math.max(
              0,
              maxDailyDistance - currentDailyDistance
            );
            const distanceToAdd = Math.min(
              activityDistance,
              remainingDailyCapacity
            );

            // Update daily distance (capped at 10km)
            dailyDistances[dayMonth] = Math.min(
              currentDailyDistance + activityDistance,
              maxDailyDistance
            );

            // Add to total distance (uncapped)
            totalDistance += activityDistance;

            // Add to capped distance (with daily cap applied)
            cappedDistance += distanceToAdd;
          });

          return {
            name: athlete_name,
            team: team,
            totalDistance: totalDistance,
            cappedDistance: cappedDistance,
            activityCount: activities.length,
            activities: activities,
            dailyDistances: dailyDistances,
            totalDistanceKm: Math.round((totalDistance / 1000) * 100) / 100,
            cappedDistanceKm: Math.round((cappedDistance / 1000) * 100) / 100,
          };
        });

        // Sort by capped distance (descending)
        const sortedAthletes = processedAthletes.sort(
          (a, b) => b.cappedDistance - a.cappedDistance
        );

        setAthletes(sortedAthletes);
      } catch (err) {
        console.error('Error fetching second week activities:', err);
        setError('Failed to load second week challenge data');
      } finally {
        setLoading(false);
      }
    };

    fetchSecondWeekActivities();
  }, []);

  const toggleExpanded = (athleteName) => {
    const newExpanded = new Set(expandedAthletes);
    if (newExpanded.has(athleteName)) {
      newExpanded.delete(athleteName);
    } else {
      newExpanded.add(athleteName);
    }
    setExpandedAthletes(newExpanded);
  };

  const toggleTeamExpanded = (teamName) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamName)) {
      newExpanded.delete(teamName);
    } else {
      newExpanded.add(teamName);
    }
    setExpandedTeams(newExpanded);
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading second week challenge data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <div>{error}</div>
      </div>
    );
  }

  // Calculate team statistics
  const teamStats = athletes.reduce((acc, athlete) => {
    const teamName = athlete.team;
    if (!acc[teamName]) {
      acc[teamName] = {
        name: teamName,
        athletes: [],
        totalCappedDistance: 0,
        totalDistance: 0,
        totalActivities: 0,
        athleteCount: 0,
      };
    }

    acc[teamName].athletes.push(athlete);
    acc[teamName].totalCappedDistance += athlete.cappedDistance;
    acc[teamName].totalDistance += athlete.totalDistance;
    acc[teamName].totalActivities += athlete.activityCount;
    acc[teamName].athleteCount += 1;

    return acc;
  }, {});

  // Convert to array and sort by capped distance
  const teamLeaderboard = Object.values(teamStats)
    .map((team) => ({
      ...team,
      totalCappedDistanceKm:
        Math.round((team.totalCappedDistance / 1000) * 100) / 100,
      totalDistanceKm: Math.round((team.totalDistance / 1000) * 100) / 100,
      averageCappedDistancePerAthlete:
        Math.round(
          (team.totalCappedDistance / team.athleteCount / 1000) * 100
        ) / 100,
    }))
    .sort((a, b) => b.totalCappedDistance - a.totalCappedDistance);

  return (
    <div style={{ padding: '0 1rem' }}>
      {/* Team Leaderboard */}
      <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Week 2 Challenge - Team Rankings</h3>
          <span className="card-subtitle">
            Teams ranked by total capped distance (10km daily limit per member)
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th title="Team ranking based on total capped distance">Rank</th>
              <th>Team</th>
              <th title="Total distance with 10km daily cap per member applied">
                Capped Distance (km)
              </th>
              <th title="Total distance without daily cap">
                Total Distance (km)
              </th>
              <th title="Number of athletes in this team">Athletes</th>
              <th title="Total activities completed by team">Activities</th>
              <th title="Average capped distance per athlete">
                Avg per Athlete (km)
              </th>
              <th title="View team member details">Details</th>
            </tr>
          </thead>
          <tbody>
            {teamLeaderboard.map((team, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const isExpanded = expandedTeams.has(team.name);

              return (
                <React.Fragment key={team.name}>
                  <tr
                    style={{
                      backgroundColor: isTop3 ? '#f8f9ff' : 'transparent',
                      borderLeft: isTop3 ? '4px solid #667eea' : 'none',
                    }}
                  >
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
                            rank === 1
                              ? '#FFD700'
                              : rank === 2
                              ? '#C0C0C0'
                              : rank === 3
                              ? '#CD7F32'
                              : '#f0f4ff',
                          color: rank <= 3 ? 'white' : '#667eea',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                        }}
                      >
                        {rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{team.name}</td>
                    <td style={{ fontWeight: '600', color: '#2d3748' }}>
                      {team.totalCappedDistanceKm.toFixed(2)} km
                    </td>
                    <td style={{ fontWeight: '500', color: '#718096' }}>
                      {team.totalDistanceKm.toFixed(2)} km
                    </td>
                    <td>{team.athleteCount}</td>
                    <td>{team.totalActivities}</td>
                    <td>
                      {team.averageCappedDistancePerAthlete.toFixed(2)} km
                    </td>
                    <td>
                      <button
                        onClick={() => toggleTeamExpanded(team.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          color: '#667eea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={
                          isExpanded ? 'Hide team members' : 'Show team members'
                        }
                      >
                        {isExpanded ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded team members row */}
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ padding: '0', backgroundColor: '#f8fafc' }}
                      >
                        <div
                          style={{
                            padding: '1rem',
                            borderTop: '1px solid #e2e8f0',
                          }}
                        >
                          <h4
                            style={{
                              marginBottom: '1rem',
                              color: '#2d3748',
                              fontSize: '1rem',
                              fontWeight: '600',
                            }}
                          >
                            {team.name} Team Members
                          </h4>
                          <div
                            style={{
                              display: 'grid',
                              gap: '0.75rem',
                              maxHeight: '400px',
                              overflowY: 'auto',
                            }}
                          >
                            {team.athletes
                              .sort(
                                (a, b) => b.cappedDistance - a.cappedDistance
                              )
                              .map((athlete, athleteIndex) => (
                                <div
                                  key={athleteIndex}
                                  style={{
                                    padding: '0.75rem',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      marginBottom: '0.5rem',
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          fontWeight: '600',
                                          color: '#2d3748',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        {athlete.name}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: '0.875rem',
                                          color: '#718096',
                                        }}
                                      >
                                        {athlete.activityCount} activities
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: 'right',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: '600',
                                          color: '#2d3748',
                                          fontSize: '0.875rem',
                                        }}
                                      >
                                        {athlete.cappedDistanceKm.toFixed(2)} km
                                        <span
                                          style={{
                                            fontSize: '0.75rem',
                                            color: '#718096',
                                            marginLeft: '0.5rem',
                                          }}
                                        >
                                          (capped)
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          fontWeight: '500',
                                          color: '#718096',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        {athlete.totalDistanceKm.toFixed(2)} km
                                        <span
                                          style={{
                                            fontSize: '0.7rem',
                                            color: '#a0aec0',
                                            marginLeft: '0.25rem',
                                          }}
                                        >
                                          (total)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Individual Athlete Leaderboard */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Week 2 Challenge - Individual Rankings</h3>
          <span className="card-subtitle">
            Athletes ranked by capped distance (10km daily limit per member)
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th title="Athlete ranking based on total capped distance">
                Rank
              </th>
              <th>Athlete</th>
              <th>Team</th>
              <th title="Total distance with 10km daily cap applied">
                Capped Distance (km)
              </th>
              <th title="Total distance without daily cap">
                Total Distance (km)
              </th>
              <th title="Number of activities completed">Activities</th>
              <th title="View individual activity details">Details</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete, index) => {
              const rank = index + 1;
              const isTop5 = rank <= 5;
              const isTop3 = rank <= 3;
              const isExpanded = expandedAthletes.has(athlete.name);

              return (
                <React.Fragment key={athlete.name}>
                  <tr
                    style={{
                      backgroundColor: isTop5 ? '#f8f9ff' : 'transparent',
                      borderLeft: isTop5 ? '4px solid #667eea' : 'none',
                    }}
                  >
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
                            rank === 1
                              ? '#FFD700'
                              : rank === 2
                              ? '#C0C0C0'
                              : rank === 3
                              ? '#CD7F32'
                              : '#f0f4ff',
                          color: rank <= 3 ? 'white' : '#667eea',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                        }}
                      >
                        {rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{athlete.name}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getTeamColors(athlete.team).bg,
                          color: getTeamColors(athlete.team).text,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {athlete.team}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#2d3748' }}>
                      {athlete.cappedDistanceKm.toFixed(2)} km
                    </td>
                    <td style={{ fontWeight: '500', color: '#718096' }}>
                      {athlete.totalDistanceKm.toFixed(2)} km
                    </td>
                    <td>{athlete.activityCount}</td>
                    <td>
                      <button
                        onClick={() => toggleExpanded(athlete.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          color: '#667eea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={
                          isExpanded ? 'Hide activities' : 'Show activities'
                        }
                      >
                        {isExpanded ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded activities row */}
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ padding: '0', backgroundColor: '#f8fafc' }}
                      >
                        <div
                          style={{
                            padding: '1rem',
                            borderTop: '1px solid #e2e8f0',
                          }}
                        >
                          <h4
                            style={{
                              marginBottom: '1rem',
                              color: '#2d3748',
                              fontSize: '1rem',
                              fontWeight: '600',
                            }}
                          >
                            {athlete.name}'s Activities
                          </h4>
                          <div
                            style={{
                              display: 'grid',
                              gap: '0.75rem',
                              maxHeight: '400px',
                              overflowY: 'auto',
                            }}
                          >
                            {athlete.activities.map(
                              (activity, activityIndex) => {
                                const dateField =
                                  activity.date ||
                                  activity.date_committed ||
                                  activity.date_fetch ||
                                  activity.daymonth;
                                const parsedDate = parseDateField(dateField);
                                const formattedDate =
                                  parsedDate?.formattedDate || 'Unknown';

                                return (
                                  <div
                                    key={activityIndex}
                                    style={{
                                      padding: '0.75rem',
                                      backgroundColor: 'white',
                                      borderRadius: '8px',
                                      border: '1px solid #e2e8f0',
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '0.5rem',
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontWeight: '600',
                                            color: '#2d3748',
                                            marginBottom: '0.25rem',
                                          }}
                                        >
                                          {activity.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: '0.875rem',
                                            color: '#718096',
                                          }}
                                        >
                                          {formattedDate} • {activity.type}
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          textAlign: 'right',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '0.25rem',
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontWeight: '600',
                                            color: '#2d3748',
                                            fontSize: '0.875rem',
                                          }}
                                        >
                                          {(activity.distance / 1000).toFixed(
                                            2
                                          )}{' '}
                                          km
                                        </div>
                                        <div
                                          style={{
                                            fontWeight: '500',
                                            color: '#718096',
                                            fontSize: '0.75rem',
                                          }}
                                        >
                                          {Math.round(
                                            activity.moving_time / 60
                                          )}{' '}
                                          min
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Week2Challenge;
