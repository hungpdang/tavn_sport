# TAVN Sport Dashboard

A comprehensive React dashboard for managing group tables, activities, and members. Built with modern React practices and Recharts for data visualization.

## Features

- **Activities Dashboard**: View and analyze sports activities with charts and tables
- **Groups Dashboard**: Monitor group statistics and member distribution
- **Members Dashboard**: Track member activity levels and engagement
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Charts**: Built with Recharts for beautiful data visualization
- **Real-time Data**: Ready for API integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard

## API Integration

The dashboard is ready for API integration. To connect to your activities endpoint:

1. Navigate to the Activities tab
2. Enter your public API endpoint URL
3. Click "Fetch Data" to load real data
4. The response will be logged to the browser console for inspection

## Project Structure

```
src/
├── components/
│   ├── ActivitiesDashboard.js    # Activities management and charts
│   ├── GroupsDashboard.js        # Groups statistics and visualization
│   └── MembersDashboard.js       # Members tracking and analytics
├── App.js                        # Main application component
├── App.css                       # Dashboard styles
└── index.js                      # Application entry point
```

## Technologies Used

- **React 19** - Modern React with hooks
- **Recharts** - Beautiful charts and data visualization
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with flexbox and grid
- **Yarn** - Package management

## Available Scripts

- `yarn start` - Runs the app in development mode
- `yarn build` - Builds the app for production
- `yarn test` - Launches the test runner
- `yarn eject` - Ejects from Create React App (one-way operation)

## Dashboard Sections

### Activities Dashboard
- Activity statistics and metrics
- Bar charts showing activity types
- Pie charts for activity distribution
- Detailed activities table
- API endpoint configuration

### Groups Dashboard
- Group statistics overview
- Scatter plot: Group size vs activities
- Group status distribution
- Members and activities per group charts
- Comprehensive groups table

### Members Dashboard
- Member statistics and engagement metrics
- Group distribution charts
- Member status pie chart
- Top active members bar chart
- Monthly member joins timeline
- Detailed members table with activity levels

## Customization

The dashboard is built with modularity in mind. Each component can be easily customized:

- **Styling**: Modify `App.css` for global styles
- **Charts**: Update chart configurations in individual dashboard components
- **Data**: Replace mock data with real API calls
- **Layout**: Adjust grid layouts and responsive breakpoints

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).