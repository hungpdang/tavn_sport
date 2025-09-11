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

// Team color mapping function for Distance Leaderboard table badges
const getTeamColors = (teamName) => {
  const teamColors = {
    Chickens: { bg: '#B3E5FC', text: '#0277BD' }, // Light blue
    'Hy2+': { bg: '#C8E6C9', text: '#2E7D32' }, // Soft green
    Gooses: { bg: '#FCE4EC', text: '#C2185B' }, // Light pink
    H2T: { bg: '#FFF3E0', text: '#F57C00' }, // Peach
    '3CE': { bg: '#F3E5F5', text: '#7B1FA2' }, // Lavender
    'The Deans': { bg: '#E0F2F1', text: '#00695C' }, // Mint
    Ducks: { bg: '#FFF9C4', text: '#F9A825' }, // Pale yellow
  };

  return teamColors[teamName] || { bg: '#f0f4ff', text: '#667eea' };
};

const ActivitiesDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_ENDPOINT = 'https://apptavn-ynfcnag4xa-uc.a.run.app/activities';

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

  // Process data for athlete distance leaderboard with daily cap logic
  const athleteDistances = activities.reduce((acc, activity) => {
    const athleteName = `${activity.athlete?.firstname} ${activity.athlete?.lastname}`;
    if (!acc[athleteName]) {
      acc[athleteName] = {
        name: athleteName,
        team: activity.athlete?.team || 'No Team',
        totalDistance: 0,
        cappedDistance: 0,
        activityCount: 0,
        activities: [],
        dailyDistances: {}, // Track daily distances for capping
      };
    }

    // Get the date for this activity
    const dateField =
      activity.date ||
      activity.date_committed ||
      activity.date_fetch ||
      activity.daymonth;
    const parsedDate = parseDateField(dateField);
    const dayMonth = parsedDate?.dayMonth || 'Unknown';

    // Initialize daily distance tracking for this day
    if (!acc[athleteName].dailyDistances[dayMonth]) {
      acc[athleteName].dailyDistances[dayMonth] = 0;
    }

    const activityDistance = activity.distance || 0;
    const currentDailyDistance = acc[athleteName].dailyDistances[dayMonth];
    const maxDailyDistance = 10000; // 10km in meters

    // Calculate how much distance can be added today (considering the 10km daily cap)
    const remainingDailyCapacity = Math.max(
      0,
      maxDailyDistance - currentDailyDistance
    );
    const distanceToAdd = Math.min(activityDistance, remainingDailyCapacity);

    // Update daily distance (capped at 10km)
    acc[athleteName].dailyDistances[dayMonth] = Math.min(
      currentDailyDistance + activityDistance,
      maxDailyDistance
    );

    // Add to total distance (uncapped)
    acc[athleteName].totalDistance += activityDistance;

    // Add to capped distance (with daily cap applied)
    acc[athleteName].cappedDistance += distanceToAdd;

    acc[athleteName].activityCount += 1;
    acc[athleteName].activities.push(activity);
    return acc;
  }, {});

  // Process data for daily activity records
  const dailyActivities = activities.reduce((acc, activity) => {
    // Use the new date field (date, date_committed, or date_fetch) with fallback to old daymonth
    const dateField =
      activity.date ||
      activity.date_committed ||
      activity.date_fetch ||
      activity.daymonth;
    const parsedDate = parseDateField(dateField);
    const dayMonth = parsedDate?.dayMonth || 'Unknown';

    if (!acc[dayMonth]) {
      acc[dayMonth] = {
        dayMonth,
        activities: [],
        totalDistance: 0,
        athleteCount: 0,
        athletes: new Set(),
        teamCount: 0,
        teams: new Set(),
        formattedDate: parsedDate?.formattedDate || 'Unknown',
      };
    }
    acc[dayMonth].activities.push(activity);
    acc[dayMonth].totalDistance += activity.distance || 0;
    acc[dayMonth].athletes.add(
      `${activity.athlete?.firstname} ${activity.athlete?.lastname}`
    );
    acc[dayMonth].teams.add(activity.athlete?.team || 'No Team');
    return acc;
  }, {});

  // Convert Set to count for daily data
  Object.values(dailyActivities).forEach((day) => {
    day.athleteCount = day.athletes.size;
    day.teamCount = day.teams.size;
    delete day.athletes;
    delete day.teams;
  });

  // Process data for team distance leaderboard with daily cap logic
  const teamDistances = activities.reduce((acc, activity) => {
    const teamName = activity.athlete?.team || 'No Team';
    const athleteName = `${activity.athlete?.firstname} ${activity.athlete?.lastname}`;

    if (!acc[teamName]) {
      acc[teamName] = {
        name: teamName,
        totalDistance: 0,
        cappedDistance: 0,
        activityCount: 0,
        athleteCount: 0,
        athletes: new Set(),
        activities: [],
        athleteDailyDistances: {}, // Track each athlete's daily distances for capping
      };
    }

    // Initialize athlete daily distance tracking
    if (!acc[teamName].athleteDailyDistances[athleteName]) {
      acc[teamName].athleteDailyDistances[athleteName] = {};
    }

    // Get the date for this activity
    const dateField =
      activity.date ||
      activity.date_committed ||
      activity.date_fetch ||
      activity.daymonth;
    const parsedDate = parseDateField(dateField);
    const dayMonth = parsedDate?.dayMonth || 'Unknown';

    // Initialize daily distance tracking for this athlete and day
    if (!acc[teamName].athleteDailyDistances[athleteName][dayMonth]) {
      acc[teamName].athleteDailyDistances[athleteName][dayMonth] = 0;
    }

    const activityDistance = activity.distance || 0;
    const currentDailyDistance =
      acc[teamName].athleteDailyDistances[athleteName][dayMonth];
    const maxDailyDistance = 10000; // 10km in meters

    // Calculate how much distance can be added today (considering the 10km daily cap)
    const remainingDailyCapacity = Math.max(
      0,
      maxDailyDistance - currentDailyDistance
    );
    const distanceToAdd = Math.min(activityDistance, remainingDailyCapacity);

    // Update daily distance (capped at 10km)
    acc[teamName].athleteDailyDistances[athleteName][dayMonth] = Math.min(
      currentDailyDistance + activityDistance,
      maxDailyDistance
    );

    // Add to total distance (uncapped)
    acc[teamName].totalDistance += activityDistance;

    // Add to capped distance (with daily cap applied)
    acc[teamName].cappedDistance += distanceToAdd;

    acc[teamName].activityCount += 1;
    acc[teamName].athletes.add(athleteName);
    acc[teamName].activities.push(activity);
    return acc;
  }, {});

  // Convert Set to count for team data
  Object.values(teamDistances).forEach((team) => {
    team.athleteCount = team.athletes.size;
    delete team.athletes; // Remove Set object
  });

  // Sort athletes by capped distance (descending) - this is the new ranking method
  const leaderboardData = Object.values(athleteDistances)
    .sort((a, b) => b.cappedDistance - a.cappedDistance)
    .map((athlete, index) => ({
      ...athlete,
      rank: index + 1,
      totalDistanceKm: Math.round((athlete.totalDistance / 1000) * 100) / 100, // Convert to km with 2 decimal places
      cappedDistanceKm: Math.round((athlete.cappedDistance / 1000) * 100) / 100, // Convert to km with 2 decimal places
      averageDistance: Math.round(
        athlete.totalDistance / athlete.activityCount
      ),
    }));

  // Sort teams by capped distance (descending) - this is the new ranking method
  const teamLeaderboardData = Object.values(teamDistances)
    .sort((a, b) => b.cappedDistance - a.cappedDistance)
    .map((team, index) => ({
      ...team,
      rank: index + 1,
      totalDistanceKm: Math.round((team.totalDistance / 1000) * 100) / 100,
      cappedDistanceKm: Math.round((team.cappedDistance / 1000) * 100) / 100,
      averageDistance: Math.round(team.totalDistance / team.activityCount),
      averageDistancePerAthlete: Math.round(
        team.totalDistance / team.athleteCount
      ),
    }));

  // Note: dailyLeaderboardData was removed as it's no longer used in the UI

  // Calculate statistics based on actual API data
  const totalActivities = activities.length;
  const totalDistance = activities.reduce(
    (sum, activity) => sum + (activity.distance || 0),
    0
  );
  const totalAthletes = Object.keys(athleteDistances).length;
  const totalTeams = Object.keys(teamDistances).length;

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
    <div style={{ padding: '0 1rem' }}>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{totalTeams}</div>
          <div className="stat-label">Total Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalAthletes}</div>
          <div className="stat-label">Total Athletes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {(totalDistance / 1000).toFixed(2)}km
          </div>
          <div className="stat-label">Total Distance</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalActivities}</div>
          <div className="stat-label">Total Activities</div>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Team Distance Leaderboard</h3>
          <span className="card-subtitle">
            Teams ranked by capped distance (10km daily limit per member)
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th title="Team ranking based on capped distance (10km daily limit per member)">
                Rank
              </th>
              <th>Team</th>
              <th title="Total distance with 10km daily cap per member applied">
                Capped Distance (km)
              </th>
              <th title="Total distance without daily cap">
                Total Distance (km)
              </th>
              <th title="Total number of activities completed by this team">
                Activities
              </th>
              <th title="Number of athletes in this team">Athletes</th>
              <th title="Average distance per athlete in the team">
                Avg Distance/Athlete (km)
              </th>
            </tr>
          </thead>
          <tbody>
            {teamLeaderboardData.map((team) => (
              <tr key={team.name}>
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
                        team.rank === 1
                          ? '#FFD700'
                          : team.rank === 2
                          ? '#C0C0C0'
                          : team.rank === 3
                          ? '#CD7F32'
                          : '#f0f4ff',
                      color: team.rank <= 3 ? 'white' : '#667eea',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    }}
                  >
                    {team.rank}
                  </span>
                </td>
                <td style={{ fontWeight: '600' }}>{team.name}</td>
                <td style={{ fontWeight: '600', color: '#2d3748' }}>
                  {team.cappedDistanceKm.toFixed(2)} km
                </td>
                <td style={{ fontWeight: '500', color: '#718096' }}>
                  {team.totalDistanceKm.toFixed(2)} km
                </td>
                <td>{team.activityCount}</td>
                <td>{team.athleteCount}</td>
                <td>{(team.averageDistancePerAthlete / 1000).toFixed(2)} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="chart-container">
          <h3 className="chart-title">Capped Distance by Athlete</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={leaderboardData.map((athlete) => ({
                name: athlete.name.split(' ')[0], // First name only for chart
                cappedDistance: athlete.cappedDistanceKm,
                totalDistance: athlete.totalDistanceKm,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  `${value} km`,
                  name === 'cappedDistance'
                    ? 'Capped Distance'
                    : 'Total Distance',
                ]}
              />
              <Bar
                dataKey="cappedDistance"
                fill="#00C49F"
                name="Capped Distance"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Capped Distance by Team</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={teamLeaderboardData.map((team) => ({
                name: team.name,
                cappedDistance: team.cappedDistanceKm,
                totalDistance: team.totalDistanceKm,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  `${value} km`,
                  name === 'cappedDistance'
                    ? 'Capped Distance'
                    : 'Total Distance',
                ]}
              />
              <Bar
                dataKey="cappedDistance"
                fill="#667eea"
                name="Capped Distance"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Distance Leaderboard</h3>
          <span className="card-subtitle">
            Athletes ranked by capped distance (10km daily limit per member)
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th title="Athlete ranking based on capped distance (10km daily limit per member)">
                Rank
              </th>
              <th>Athlete</th>
              <th>Team</th>
              <th title="Total distance with 10km daily cap per member applied">
                Capped Distance (km)
              </th>
              <th title="Total distance without daily cap">
                Total Distance (km)
              </th>
              <th title="Total number of activities completed by this athlete">
                Activities
              </th>
              <th title="Average distance per activity for this athlete">
                Avg Distance (km)
              </th>
              <th title="Distance of the athlete's longest single activity">
                Best Activity
              </th>
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
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: getTeamColors(athlete.team).bg,
                        color: getTeamColors(athlete.team).text,
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
                  <td>{(athlete.averageDistance / 1000).toFixed(2)} km</td>
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
