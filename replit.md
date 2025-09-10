# Walking Challenge Dashboard

## Overview
This is a React-based web application that displays a comprehensive dashboard for a walking challenge competition. The app shows statistics, leaderboards, and visualizations for activities, teams, and individual participants.

**Current Status**: ✅ Fully configured and running in Replit environment
**Last Updated**: September 10, 2025

## Project Architecture

### Technology Stack
- **Frontend**: React 19.1.1 with Create React App
- **Charts**: Recharts library for data visualization
- **HTTP Client**: Axios for API calls
- **Styling**: CSS with custom styling
- **Package Manager**: npm

### Project Structure
```
src/
├── components/
│   ├── ActivitiesDashboard.js    # Overall statistics and leaderboards
│   ├── GroupsDashboard.js        # Team-focused dashboard
│   └── MembersDashboard.js       # Individual member dashboard
├── App.js                        # Main app with tab navigation
├── App.css                       # Application styles
└── index.js                      # React app entry point
```

### Key Features
1. **Overall Dashboard**: Total statistics, team rankings, distance charts
2. **Team Dashboard**: Team-specific metrics and comparisons
3. **Individual Dashboard**: Personal athlete leaderboards and achievements
4. **Real-time Data**: Fetches live data from external API
5. **Interactive Charts**: Bar charts showing distance metrics
6. **Responsive Design**: Mobile-friendly interface

## Configuration Details

### Development Environment
- **Host**: 0.0.0.0 (configured for Replit proxy)
- **Port**: 5000
- **Dev Server**: React Scripts with host check disabled
- **API Endpoint**: https://apptavn-ynfcnag4xa-uc.a.run.app/activities

### Replit-Specific Setup
- Modified `package.json` start script to bind to 0.0.0.0:5000
- Disabled host checking with `DANGEROUSLY_DISABLE_HOST_CHECK=true`
- Configured workflow to run development server
- Set up deployment configuration for production builds

### Deployment Configuration
- **Target**: Autoscale (stateless frontend)
- **Build Command**: `npm run build`
- **Run Command**: `npx serve -s build -l 5000`

## Data Sources
The application fetches walking challenge data from an external API that provides:
- Athlete information (names, teams)
- Activity details (distance, time, elevation)
- Date tracking for activities
- Team affiliations and statistics

## Recent Changes
- **Sept 10, 2025**: Initial import and Replit environment setup
- Configured React dev server for Replit proxy compatibility
- Set up deployment configuration for production
- Added serve package for static file serving

## Development Notes
- The app uses environment-specific configurations to work with Replit's proxy system
- All API calls are to external endpoints (no local backend required)
- Charts automatically update when data is fetched from the API
- Responsive design ensures compatibility across different screen sizes

## User Preferences
- Frontend-only application with external API integration
- Clean, modern dashboard interface with tabbed navigation
- Real-time data visualization with interactive charts
- Team-based competition tracking with individual performance metrics