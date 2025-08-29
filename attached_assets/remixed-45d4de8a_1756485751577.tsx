import React, { useState, useEffect } from 'react';

const GameScopeAngularApp = () => {
  // State management (simulating Angular services)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('fixtures');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // User role simulation - set to 'coach' for this prototype
  const [userRole] = useState('coach'); // can be 'admin', 'coach', 'player'
  const [currentUser] = useState({
    name: 'Dee Shivraman',
    role: 'Head Coach',
    team: 'WOMEN\'S SOCCER',
    email: 'dee.shivraman@polk.edu',
    avatar: 'DS'
  });
  
  // State for fixtures management
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // State for player management
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAddingNewPlayer, setIsAddingNewPlayer] = useState(false);
  
  // State for match details
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null);
  const [selectedStatCategory, setSelectedStatCategory] = useState('key-metrics');
  const [selectedPeriod, setSelectedPeriod] = useState('fullGame');
  
  // Club configuration
  const clubName = "Polk State College";

  // Sample team data
  const teams = [
    {
      id: 'womens-soccer',
      name: 'WOMEN\'S SOCCER',
      shortName: 'WSC',
      status: 'ACTIVE',
      coach: 'Dee Shivraman',
      assistantCoach: 'Brian McNulty',
      created: '1 month ago',
      userCount: 23,
      matchCount: 3,
      processingCount: 2,
      ageGroup: 'College',
      gender: 'Women',
      season: '2024/25'
    }
  ];

  // Squad data
  const squadData = {
    'womens-soccer': [
      // Goalkeepers
      { id: 1, name: 'Kati Nikel', position: 'GK', jerseyNumber: 0, year: 'Sophomore', hometown: 'Tampa, FL', height: '5\'8"', goals: 0, assists: 0, appearances: 6 },
      { id: 2, name: 'Ashley Miller', position: 'GK', jerseyNumber: 1, year: 'Freshman', hometown: 'Orlando, FL', height: '5\'7"', goals: 0, assists: 0, appearances: 2 },
      
      // Defenders
      { id: 3, name: 'Lulu Vester', position: 'CB', jerseyNumber: 2, year: 'Senior', hometown: 'Miami, FL', height: '5\'6"', goals: 1, assists: 2, appearances: 6 },
      { id: 4, name: 'Paula Cortijo', position: 'CB', jerseyNumber: 3, year: 'Junior', hometown: 'Jacksonville, FL', height: '5\'7"', goals: 0, assists: 1, appearances: 6 },
      { id: 5, name: 'Kaylin Allen', position: 'LB', jerseyNumber: 4, year: 'Sophomore', hometown: 'Gainesville, FL', height: '5\'5"', goals: 2, assists: 3, appearances: 6 },
      { id: 6, name: 'Riley Whale', position: 'RB', jerseyNumber: 5, year: 'Freshman', hometown: 'St. Petersburg, FL', height: '5\'4"', goals: 1, assists: 4, appearances: 5 },
      { id: 7, name: 'Delight Kuboya', position: 'CB', jerseyNumber: 22, year: 'Sophomore', hometown: 'Tallahassee, FL', height: '5\'8"', goals: 0, assists: 0, appearances: 4 },
      { id: 8, name: 'Hanna Williams', position: 'LB', jerseyNumber: 23, year: 'Junior', hometown: 'Fort Lauderdale, FL', height: '5\'6"', goals: 0, assists: 2, appearances: 5 },
      { id: 9, name: 'Augustina Carnero', position: 'RB', jerseyNumber: 25, year: 'Freshman', hometown: 'Naples, FL', height: '5\'5"', goals: 1, assists: 1, appearances: 4 },
      { id: 10, name: 'Abigail Rogers', position: 'CB', jerseyNumber: 27, year: 'Sophomore', hometown: 'Pensacola, FL', height: '5\'7"', goals: 0, assists: 0, appearances: 3 },
      
      // Midfielders
      { id: 11, name: 'Jaiden Roberts', position: 'CM', jerseyNumber: 16, year: 'Junior', hometown: 'Lakeland, FL', height: '5\'6"', goals: 3, assists: 5, appearances: 6 },
      { id: 12, name: 'Jacquelyn Spears', position: 'CDM', jerseyNumber: 17, year: 'Senior', hometown: 'Clearwater, FL', height: '5\'5"', goals: 1, assists: 3, appearances: 6 },
      { id: 13, name: 'Sofia Salas', position: 'CAM', jerseyNumber: 18, year: 'Junior', hometown: 'Sarasota, FL', height: '5\'7"', goals: 4, assists: 6, appearances: 6, isCurrent: true },
      { id: 14, name: 'Jordan Roberts', position: 'CM', jerseyNumber: 19, year: 'Sophomore', hometown: 'Boca Raton, FL', height: '5\'6"', goals: 2, assists: 4, appearances: 5 },
      { id: 15, name: 'Laura Sofia', position: 'LM', jerseyNumber: 20, year: 'Freshman', hometown: 'Key West, FL', height: '5\'4"', goals: 1, assists: 2, appearances: 4 },
      
      // Forwards
      { id: 16, name: 'Janessa Crespo', position: 'ST', jerseyNumber: 9, year: 'Senior', hometown: 'West Palm Beach, FL', height: '5\'8"', goals: 12, assists: 3, appearances: 6 },
      { id: 17, name: 'Marie Narewski', position: 'LW', jerseyNumber: 10, year: 'Junior', hometown: 'Fort Myers, FL', height: '5\'5"', goals: 8, assists: 5, appearances: 6 },
      { id: 18, name: 'Taylor Armstead', position: 'RW', jerseyNumber: 12, year: 'Sophomore', hometown: 'Daytona Beach, FL', height: '5\'6"', goals: 6, assists: 4, appearances: 6 },
      { id: 19, name: 'Kianna Kropp', position: 'ST', jerseyNumber: 13, year: 'Freshman', hometown: 'Melbourne, FL', height: '5\'7"', goals: 5, assists: 2, appearances: 5 },
      { id: 20, name: 'Maddie English', position: 'LW', jerseyNumber: 28, year: 'Sophomore', hometown: 'Coral Springs, FL', height: '5\'5"', goals: 4, assists: 3, appearances: 5 },
      { id: 21, name: 'Alayna Dial', position: 'RW', jerseyNumber: 29, year: 'Freshman', hometown: 'Hialeah, FL', height: '5\'6"', goals: 3, assists: 2, appearances: 4 },
      { id: 22, name: 'Zactavia Gant', position: 'ST', jerseyNumber: 30, year: 'Sophomore', hometown: 'Hollywood, FL', height: '5\'7"', goals: 7, assists: 1, appearances: 6 },
      { id: 23, name: 'Alex Van Lare', position: 'CF', jerseyNumber: 99, year: 'Junior', hometown: 'Ocala, FL', height: '5\'8"', goals: 9, assists: 4, appearances: 6 }
    ]
  };

  // Sample fixture data
  const fixtureData = {
    'womens-soccer': [
      // Past matches (for results section)
      {
        id: 1,
        opponent: 'Southeastern University',
        date: '2025-08-15T19:00:00',
        venue: 'Southeastern University',
        type: 'AWAY',
        status: 'COMPLETED',
        score: { home: 0, away: 3 },
        hasVideo: false,
        competition: 'FCSAA Pre-Season'
      },
      {
        id: 2,
        opponent: 'Florida College',
        date: '2025-08-16T12:00:00',
        venue: 'Florida College',
        type: 'AWAY',
        status: 'COMPLETED',
        score: { home: 0, away: 7 },
        hasVideo: true,
        competition: 'FCSAA Pre-Season',
        videoLinks: {
          firstHalf: 'https://app.veo.co/matches/20250613-match-womens-soccer-091a902e/',
          secondHalf: 'https://app.veo.co/matches/20250613-9e9983b7-f279-4b54-b113-b5a58c604892-00306070/'
        }
      },
      {
        id: 3,
        opponent: 'Idea Sports - Disney',
        date: '2025-08-20T18:00:00',
        venue: 'Disney Sports Complex',
        type: 'NEUTRAL',
        status: 'COMPLETED',
        score: { home: 0, away: 0 },
        hasVideo: false,
        competition: 'FCSAA Pre-Season'
      },
      // Current season fixtures
      {
        id: 4,
        opponent: 'Millennia Atlantic University',
        date: '2025-08-22T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'COMPLETED',
        score: { home: 8, away: 0 },
        hasVideo: true,
        videoLinks: {
          match: 'https://app.veo.co/matches/20250822-millennia-match-full/'
        },
        competition: 'FCSAA League'
      },
      {
        id: 5,
        opponent: 'Monroe University',
        date: '2025-08-24T10:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'NO CONTEST',
        score: null,
        hasVideo: false,
        competition: 'FCSAA League',
        notes: 'No contest after 62 minutes due to field conditions'
      },
              {
        id: 6,
        opponent: 'Montgomery College (MD)',
        date: '2025-08-29T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 7,
        opponent: 'Webber International University JV',
        date: '2025-09-03T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 8,
        opponent: 'Warner University (Fla.) JV',
        date: '2025-09-09T19:00:00',
        venue: 'Lake Wales, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 9,
        opponent: 'Miami Dade College',
        date: '2025-09-11T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 10,
        opponent: 'Trinity Baptist College JV',
        date: '2025-09-13T14:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 11,
        opponent: 'Eastern Florida State College',
        date: '2025-09-16T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 12,
        opponent: 'Saint Leo University JV',
        date: '2025-09-18T19:00:00',
        venue: 'Saint Leo, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 13,
        opponent: 'Edward Waters University JV',
        date: '2025-09-20T15:00:00',
        venue: 'Jacksonville, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 14,
        opponent: 'Daytona State College',
        date: '2025-09-24T19:00:00',
        venue: 'Daytona Beach, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 15,
        opponent: 'Eckerd College JV',
        date: '2025-10-06T19:00:00',
        venue: 'St. Petersburg, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 16,
        opponent: 'Eastern Florida State College',
        date: '2025-10-08T19:00:00',
        venue: 'Cocoa, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 17,
        opponent: 'Miami Dade College',
        date: '2025-10-10T19:00:00',
        venue: 'Miami, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 18,
        opponent: 'Atlantis University JV',
        date: '2025-10-11T15:00:00',
        venue: 'Miami, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 19,
        opponent: 'Daytona State College',
        date: '2025-10-15T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 20,
        opponent: 'Saint Leo University JV',
        date: '2025-10-19T12:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      },
      {
        id: 21,
        opponent: 'Florida Southern College JV',
        date: '2025-10-22T19:00:00',
        venue: 'Lakeland, FL',
        type: 'AWAY',
        status: 'SCHEDULED',
        hasVideo: false,
        competition: 'FCSAA League'
      }
    ]
  };

  // Sample upcoming fixtures data
  const upcomingFixtures = {
    'womens-soccer': [
      {
        id: 6,
        opponent: 'Montgomery College (MD)',
        date: '2025-08-29T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        competition: 'FCSAA League',
        importance: 'normal'
      },
      {
        id: 7,
        opponent: 'Webber International University JV',
        date: '2025-09-03T16:00:00',
        venue: 'Polk State Soccer Field',
        type: 'HOME',
        competition: 'FCSAA League',
        importance: 'high'
      },
      {
        id: 8,
        opponent: 'Warner University (Fla.) JV',
        date: '2025-09-09T19:00:00',
        venue: 'Lake Wales, FL',
        type: 'AWAY',
        competition: 'FCSAA League',
        importance: 'normal'
      }
    ]
  };

  // Match statistics data
  const matchStats = {
    2: { // Florida College match
      firstHalf: {
        polk: {
          totalTeamDistance: 21.98,
          possession: 76.37,
          goals: 5,
          shotsAttempted: 21,
          shotsOnTarget: 13,
          runsIntoBoxes: 36,
          corners: 1,
          dangerousCrosses: 8,
          dribbles: 30,
          penetratingDribbles: 4,
          takeOns: 6,
          firstTouchSuccess: 271,
          firstTouchSuccessRate: 90.94,
          tackles: 5,
          freeKicks: 1,
          offsides: 3,
          passesAttempted: 298,
          passesSuccess: 181,
          passingSuccessRate: 60.74,
          passingTotalDistance: 2034.2,
          passingAverageDistance: 11.24,
          passingAverageVelocity: 20.97
        },
        opponent: {
          totalTeamDistance: 19.13,
          possession: 23.63,
          goals: 0,
          shotsAttempted: 1,
          shotsOnTarget: 0,
          runsIntoBoxes: 4,
          corners: 3,
          dangerousCrosses: 0,
          dribbles: 7,
          penetratingDribbles: 0,
          takeOns: 1,
          firstTouchSuccess: 88,
          firstTouchSuccessRate: 74.56,
          tackles: 15,
          freeKicks: 3,
          offsides: 0,
          passesAttempted: 118,
          passesSuccess: 56,
          passingSuccessRate: 47.46,
          passingTotalDistance: 592.6,
          passingAverageDistance: 10.58,
          passingAverageVelocity: 13.04
        }
      },
      secondHalf: {
        polk: {
          totalTeamDistance: 8.78,
          possession: 76.37,
          goals: 2,
          shotsAttempted: 9,
          shotsOnTarget: 6,
          runsIntoBoxes: 25,
          corners: 0,
          dangerousCrosses: 3,
          dribbles: 14,
          penetratingDribbles: 6,
          takeOns: 7,
          firstTouchSuccess: 141,
          firstTouchSuccessRate: 91.56,
          tackles: 2,
          freeKicks: 0,
          offsides: 2,
          passesAttempted: 154,
          passesSuccess: 98,
          passingSuccessRate: 63.63,
          passingTotalDistance: 977.72,
          passingAverageDistance: 9.98,
          passingAverageVelocity: 17.84
        },
        opponent: {
          totalTeamDistance: 6.56,
          possession: 23.63,
          goals: 0,
          shotsAttempted: 0,
          shotsOnTarget: 0,
          runsIntoBoxes: 0,
          corners: 0,
          dangerousCrosses: 0,
          dribbles: 3,
          penetratingDribbles: 0,
          takeOns: 2,
          firstTouchSuccess: 67,
          firstTouchSuccessRate: 81.71,
          tackles: 4,
          freeKicks: 4,
          offsides: 0,
          passesAttempted: 82,
          passesSuccess: 45,
          passingSuccessRate: 54.88,
          passingTotalDistance: 323.4,
          passingAverageDistance: 7.19,
          passingAverageVelocity: 14.05
        }
      },
      fullGame: {
        polk: {
          totalTeamDistance: 30.76,
          possession: 76.37,
          goals: 7,
          shotsAttempted: 30,
          shotsOnTarget: 19,
          runsIntoBoxes: 61,
          corners: 1,
          dangerousCrosses: 11,
          dribbles: 44,
          penetratingDribbles: 10,
          takeOns: 13,
          firstTouchSuccess: 412,
          firstTouchSuccessRate: 91.25,
          tackles: 7,
          freeKicks: 1,
          offsides: 5,
          passesAttempted: 452,
          passesSuccess: 279,
          passingSuccessRate: 61.73,
          passingTotalDistance: 3011.91,
          passingAverageDistance: 10.79,
          passingAverageVelocity: 19.41,
          // Normalized values (POLK's share of total performance)
          normalized: {
            possession: 0.76370,
            goals: 1.00000,
            shotsAttempted: 0.96774,
            shotsOnTarget: 1.00000,
            runsIntoBoxes: 0.93846,
            dribbles: 0.81481,
            takeOns: 0.81250,
            firstTouchSuccess: 0.72663,
            passingSuccessRate: 0.55003,
            passingTotalDistance: 0.76680
          }
        },
        opponent: {
          totalTeamDistance: 25.69,
          possession: 23.63,
          goals: 0,
          shotsAttempted: 1,
          shotsOnTarget: 0,
          runsIntoBoxes: 4,
          corners: 3,
          dangerousCrosses: 0,
          dribbles: 10,
          penetratingDribbles: 0,
          takeOns: 3,
          firstTouchSuccess: 155,
          firstTouchSuccessRate: 78.14,
          tackles: 19,
          freeKicks: 7,
          offsides: 0,
          passesAttempted: 200,
          passesSuccess: 101,
          passingSuccessRate: 50.5,
          passingTotalDistance: 915.99,
          passingAverageDistance: 9.07,
          passingAverageVelocity: 13.55
        }
      }
    }
  };

  // Color themes (simulating Angular service)
  const colorThemes = [
    { 
      name: 'red', 
      light: { accent: '#dc2626', light: '#fef2f2' }, 
      dark: { accent: '#ef4444', light: '#1e293b' } 
    },
    { 
      name: 'blue', 
      light: { accent: '#2563eb', light: '#eff6ff' }, 
      dark: { accent: '#3b82f6', light: '#1e293b' } 
    },
    { 
      name: 'green', 
      light: { accent: '#059669', light: '#ecfdf5' }, 
      dark: { accent: '#10b981', light: '#1e293b' } 
    }
  ];

  // Navigation items (simulating Angular service)
  const getNavigationItems = () => {
    // Coach role - show fixtures management, results, and team
    if (userRole === 'coach') {
      return {
        main: [
          { id: 'fixtures', label: 'Fixtures', icon: 'calendar', tooltip: 'Manage Fixtures' },
          { id: 'fixtures-videos', label: 'Results', icon: 'video-camera', tooltip: 'Results' },
          { id: 'my-team', label: 'My Team', icon: 'shield-user', tooltip: 'My Team Info' }
        ]
      };
    }
    
    // Player role - only show fixtures and videos
    if (userRole === 'player') {
      return {
        main: [
          { id: 'fixtures-videos', label: 'Results', icon: 'video-camera', tooltip: 'Results' },
          { id: 'my-team', label: 'My Team', icon: 'shield-user', tooltip: 'My Team Info' }
        ]
      };
    }
    
    return { main: [] };
  };

  // Icon component
  const Icon = ({ name, className = "w-5 h-5", style = {} }) => {
    const iconMap = {
      calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      shield: "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      crosshair: "M12 2v4m0 12v4M2 12h4m12 0h4", // Crosshair path
      'video-camera': "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
      'shield-user': "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 13a3 3 0 100-6 3 3 0 000 6zm-1 1a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
      moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
      menu: "M4 6h16M4 12h16M4 18h16",
      'chevron-left': "M15 19l-7-7 7-7"
    };

    // Special handling for crosshair icon with circle
    if (name === 'crosshair') {
      return (
        <svg 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          className={className}
          style={{ flexShrink: 0, ...style }}
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconMap[name]} />
        </svg>
      );
    }

    return (
      <svg 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        className={className}
        style={{ flexShrink: 0, ...style }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconMap[name]} />
      </svg>
    );
  };

  // Theme service methods
  const getCurrentTheme = () => colorThemes[currentColorIndex];
  const getThemeColors = () => {
    const theme = getCurrentTheme();
    return isDarkTheme ? theme.dark : theme.light;
  };
  
  // Get current theme colors
  const themeColors = getThemeColors();

  // Navigation service methods
  const handleNavigation = (itemId) => {
    setActiveNavItem(itemId);
    if (isMobile) {
      setSidebarHidden(true);
    }
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const cycleColorTheme = () => {
    const newIndex = (currentColorIndex + 1) % colorThemes.length;
    setCurrentColorIndex(newIndex);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Lifecycle hooks
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarHidden(true);
      } else {
        setSidebarHidden(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Base styles
  const baseStyles = {
    app: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff',
      color: isDarkTheme ? '#f8fafc' : '#0f172a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    },
    sidebar: {
      width: sidebarCollapsed ? '80px' : '280px',
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      transition: 'all 0.3s ease',
      zIndex: 200,
      borderRight: '1px solid #e2e8f0',
      backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
      color: isDarkTheme ? '#f8fafc' : '#0f172a',
      transform: isMobile && sidebarHidden ? 'translateX(-100%)' : 'translateX(0)'
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : sidebarCollapsed ? '80px' : '280px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      transition: 'margin-left 0.3s ease'
    },
    header: {
      height: '80px',
      backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }
  };

  // Sidebar Component
  const SidebarComponent = () => {
    const navigationItems = getNavigationItems();
    
    const NavSection = ({ items }) => (
      <nav style={{ padding: '1.5rem 0' }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            title={sidebarCollapsed ? item.tooltip : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sidebarCollapsed ? 0 : '0.75rem',
              padding: sidebarCollapsed ? '0.75rem' : '0.75rem 1.5rem',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              color: activeNavItem === item.id ? themeColors.accent : (isDarkTheme ? '#cbd5e1' : '#64748b'),
              backgroundColor: activeNavItem === item.id ? themeColors.light : 'transparent',
              border: 'none',
              borderRight: `3px solid ${activeNavItem === item.id ? themeColors.accent : 'transparent'}`,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <Icon name={item.icon} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    );

    return (
      <aside style={baseStyles.sidebar}>
        <div style={{
          height: '80px',
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColors.accent
              }}>
                <Icon name="crosshair" className="w-7 h-7" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 400 }}>Gamescope</div>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColors.accent
            }}>
              <Icon name="crosshair" className="w-6 h-6" />
            </div>
          )}
          <button 
            onClick={toggleSidebarCollapse}
            title="Toggle sidebar"
            style={{
              backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
              border: 'none',
              color: isDarkTheme ? '#cbd5e1' : '#64748b',
              padding: '0.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <Icon name="chevron-left" className="w-4 h-4" />
          </button>
        </div>
        
        <NavSection items={navigationItems.main} />
      </aside>
    );
  };

  // Header Component
  const HeaderComponent = () => {
    return (
      <header style={baseStyles.header}>
        <div style={{
          height: '100%',
          padding: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && (
              <button 
                onClick={toggleSidebar}
                title="Toggle menu"
                style={{
                  backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                  border: 'none',
                  color: isDarkTheme ? '#cbd5e1' : '#64748b',
                  padding: '0.625rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginRight: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name="menu" />
              </button>
            )}
            
            <div 
              style={{ 
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                borderRadius: '50%',
                backgroundColor: themeColors.accent,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600
              }}
            >
              PSC
            </div>
            <div>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: 600,
                color: isDarkTheme ? '#f8fafc' : '#0f172a',
                letterSpacing: '-0.025em'
              }}>
                {clubName}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '0.5rem' : '0.75rem' 
          }}>
            <button 
              onClick={cycleColorTheme} 
              title="Change color theme"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: themeColors.accent,
                padding: '0.625rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
            <button 
              onClick={toggleTheme} 
              title="Toggle theme"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: isDarkTheme ? '#cbd5e1' : '#64748b',
                padding: '0.625rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name={isDarkTheme ? 'sun' : 'moon'} />
            </button>
            <button 
              title="Notifications"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: isDarkTheme ? '#cbd5e1' : '#64748b',
                padding: '0.625rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="bell" />
            </button>
            <button 
              title="Profile"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: isDarkTheme ? '#cbd5e1' : '#64748b',
                padding: '0.625rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="user" />
            </button>
          </div>
        </div>
      </header>
    );
  };

  // Match Details Page Component
  const renderMatchDetailsPage = () => {
    if (!selectedMatchDetails) return null;
    
    const { fixture, stats } = selectedMatchDetails;
    const currentStats = stats[selectedPeriod];
    
    const StatRow = ({ label, polk, opponent, unit = '', isPercentage = false }) => {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: `1px solid ${isDarkTheme ? '#334155' : '#f1f5f9'}`
        }}>
          <span style={{ fontSize: '14px', color: isDarkTheme ? '#cbd5e1' : '#64748b' }}>
            {label}
          </span>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '16px', 
            fontWeight: 600,
            color: themeColors.accent 
          }}>
            {isPercentage ? `${polk.toFixed(1)}%` : `${polk}${unit}`}
          </div>
          <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 500 }}>
            {isPercentage ? `${opponent.toFixed(1)}%` : `${opponent}${unit}`}
          </div>
        </div>
      );
    };

    // Spider Chart Component
    const SpiderChart = ({ polkData, opponentData }) => {
      const size = 300;
      const center = size / 2;
      const radius = 120;
      
      const metrics = [
        { key: 'possession', label: 'Possession' },
        { key: 'goals', label: 'Goals' },
        { key: 'shotsOnTarget', label: 'Shots On Target' },
        { key: 'runsIntoBoxes', label: 'Runs Into Boxes' },
        { key: 'dribbles', label: 'Dribbles' },
        { key: 'takeOns', label: 'Take Ons' },
        { key: 'firstTouchSuccess', label: 'First Touch' },
        { key: 'passingTotalDistance', label: 'Passing Distance' }
      ];

      const angleStep = (2 * Math.PI) / metrics.length;
      
      // Generate points for both teams
      const generatePoints = (data) => metrics.map((metric, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const value = Math.min(data[metric.key] || 0, 1);
        const x = center + Math.cos(angle) * radius * value;
        const y = center + Math.sin(angle) * radius * value;
        return { x, y };
      });

      const polkPoints = generatePoints(polkData);
      const opponentPoints = generatePoints(opponentData);

      const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
      
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Grid circles */}
            {gridLevels.map((level, index) => (
              <circle
                key={`grid-${index}`}
                cx={center}
                cy={center}
                r={radius * level}
                fill="none"
                stroke={isDarkTheme ? '#334155' : '#e2e8f0'}
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
            
            {/* Grid lines */}
            {metrics.map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const x = center + Math.cos(angle) * radius;
              const y = center + Math.sin(angle) * radius;
              return (
                <line
                  key={`line-${index}`}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={isDarkTheme ? '#334155' : '#e2e8f0'}
                  strokeWidth="1"
                  opacity="0.5"
                />
              );
            })}
            
            {/* Opponent polygon (behind) */}
            <polygon
              points={opponentPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="#00000030"
              stroke="#000000"
              strokeWidth="2"
            />
            
            {/* POLK polygon (in front) */}
            <polygon
              points={polkPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill={`${themeColors.accent}30`}
              stroke={themeColors.accent}
              strokeWidth="2"
            />
            
            {/* Data points - Opponent */}
            {opponentPoints.map((point, index) => (
              <circle
                key={`opponent-point-${index}`}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#000000"
              />
            ))}
            
            {/* Data points - POLK */}
            {polkPoints.map((point, index) => (
              <circle
                key={`polk-point-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={themeColors.accent}
              />
            ))}
            
            {/* Labels */}
            {metrics.map((metric, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const labelRadius = radius + 20;
              const x = center + Math.cos(angle) * labelRadius;
              const y = center + Math.sin(angle) * labelRadius;
              
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill={isDarkTheme ? '#cbd5e1' : '#64748b'}
                  fontWeight="500"
                >
                  {metric.label}
                </text>
              );
            })}
            
            {/* Center grid values */}
            {gridLevels.map((level, index) => (
              <text
                key={`grid-label-${index}`}
                x={center + 5}
                y={center - radius * level}
                fontSize="8"
                fill={isDarkTheme ? '#94a3b8' : '#6b7280'}
                opacity="0.7"
              >
                {(level * 100).toFixed(0)}%
              </text>
            ))}
          </svg>
        </div>
      );
    };
    
    const getStatsForCategory = (category) => {
      switch(category) {
        case 'key-metrics':
          return [
            { label: 'Total Team Distance', polk: currentStats.polk.totalTeamDistance, opponent: currentStats.opponent.totalTeamDistance, unit: ' km' },
            { label: 'Possession', polk: currentStats.polk.possession, opponent: currentStats.opponent.possession, unit: '%', isPercentage: true }
          ];
        case 'attack':
          return [
            { label: 'Goals', polk: currentStats.polk.goals, opponent: currentStats.opponent.goals },
            { label: 'Shots Attempted', polk: currentStats.polk.shotsAttempted, opponent: currentStats.opponent.shotsAttempted },
            { label: 'Shots On Target', polk: currentStats.polk.shotsOnTarget, opponent: currentStats.opponent.shotsOnTarget },
            { label: 'Runs Into Boxes', polk: currentStats.polk.runsIntoBoxes, opponent: currentStats.opponent.runsIntoBoxes },
            { label: 'Corners', polk: currentStats.polk.corners, opponent: currentStats.opponent.corners },
            { label: 'Dangerous Crosses', polk: currentStats.polk.dangerousCrosses, opponent: currentStats.opponent.dangerousCrosses }
          ];
        case 'possession':
          return [
            { label: 'Dribbles', polk: currentStats.polk.dribbles, opponent: currentStats.opponent.dribbles },
            { label: 'Penetrating Dribbles', polk: currentStats.polk.penetratingDribbles, opponent: currentStats.opponent.penetratingDribbles },
            { label: 'Take Ons', polk: currentStats.polk.takeOns, opponent: currentStats.opponent.takeOns },
            { label: 'First Touch Success', polk: currentStats.polk.firstTouchSuccess, opponent: currentStats.opponent.firstTouchSuccess },
            { label: 'First Touch Success Rate', polk: currentStats.polk.firstTouchSuccessRate, opponent: currentStats.opponent.firstTouchSuccessRate, unit: '%', isPercentage: true }
          ];
        case 'defense':
          return [
            { label: 'Tackles', polk: currentStats.polk.tackles, opponent: currentStats.opponent.tackles },
            { label: 'Free Kicks', polk: currentStats.polk.freeKicks, opponent: currentStats.opponent.freeKicks },
            { label: 'Offsides', polk: currentStats.polk.offsides, opponent: currentStats.opponent.offsides }
          ];
        case 'passing':
          return [
            { label: 'Pass Total Attempted', polk: currentStats.polk.passesAttempted, opponent: currentStats.opponent.passesAttempted },
            { label: 'Pass Success', polk: currentStats.polk.passesSuccess, opponent: currentStats.opponent.passesSuccess },
            { label: 'Pass Success Rate', polk: currentStats.polk.passingSuccessRate, opponent: currentStats.opponent.passingSuccessRate, unit: '%', isPercentage: true },
            { label: 'Pass Total Distance', polk: currentStats.polk.passingTotalDistance, opponent: currentStats.opponent.passingTotalDistance, unit: ' m' },
            { label: 'Pass Average Distance', polk: currentStats.polk.passingAverageDistance, opponent: currentStats.opponent.passingAverageDistance, unit: ' m' },
            { label: 'Pass Average Velocity', polk: currentStats.polk.passingAverageVelocity, opponent: currentStats.opponent.passingAverageVelocity, unit: ' km/h' }
          ];
        case 'videos':
          return fixture.videoLinks ? [
            { label: '1st Half', link: fixture.videoLinks.firstHalf, isVideo: true },
            { label: '2nd Half', link: fixture.videoLinks.secondHalf, isVideo: true }
          ] : [];
        default:
          return [];
      }
    };
    
    const statCategories = [
      { id: 'key-metrics', label: 'Key Metrics' },
      { id: 'attack', label: 'Attack' },
      { id: 'possession', label: 'Possession' },
      { id: 'defense', label: 'Defense' },
      { id: 'passing', label: 'Passing' },
      { id: 'videos', label: 'Videos' },
      { id: 'spider', label: 'Performance Chart' }
    ];
    
    return (
      <div style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        overflowY: 'auto',
        backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              setSelectedMatchDetails(null);
              setActiveNavItem('fixtures-videos');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: themeColors.accent,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '1rem',
              padding: '0.5rem 0'
            }}
          >
            <Icon name="chevron-left" className="w-4 h-4" />
            Back to Fixtures
          </button>
          
          <div style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: 600,
            color: themeColors.accent,
            marginBottom: '0.5rem'
          }}>
            Match Results
          </div>
          
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: isDarkTheme ? '#f8fafc' : '#0f172a'
          }}>
            vs {fixture.opponent}
          </h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              color: isDarkTheme ? '#cbd5e1' : '#64748b',
              fontSize: '16px'
            }}>
              {new Date(fixture.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            
            {fixture.score && (
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#22c55e',
                padding: '8px 16px',
                backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`
              }}>
                {fixture.type === 'HOME' ? 
                  `${fixture.score.home}-${fixture.score.away}` : 
                  `${fixture.score.away}-${fixture.score.home}`}
              </div>
            )}
          </div>
        </div>

        {/* Period Selector */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '8px'
        }}>
          {[
            { id: 'firstHalf', label: '1st Half' },
            { id: 'secondHalf', label: '2nd Half' },
            { id: 'fullGame', label: 'Full Game' }
          ].map(period => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedPeriod === period.id ? themeColors.accent : (isDarkTheme ? '#1e293b' : '#ffffff'),
                color: selectedPeriod === period.id ? 'white' : (isDarkTheme ? '#cbd5e1' : '#64748b'),
                transition: 'all 0.2s ease',
                border: `1px solid ${selectedPeriod === period.id ? themeColors.accent : (isDarkTheme ? '#334155' : '#e2e8f0')}`
              }}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Category Navigation */}
        <div style={{
          marginBottom: '2rem',
          borderBottom: `2px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'flex',
            gap: '0',
            minWidth: 'max-content'
          }}>
            {statCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedStatCategory(category.id)}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: selectedStatCategory === category.id ? themeColors.accent : (isDarkTheme ? '#94a3b8' : '#64748b'),
                  borderBottom: `3px solid ${selectedStatCategory === category.id ? themeColors.accent : 'transparent'}`,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Table */}
        <div style={{
          display: ['attack', 'possession', 'defense', 'passing', 'key-metrics'].includes(selectedStatCategory) ? 'grid' : 'block',
          gridTemplateColumns: ['attack', 'possession', 'defense', 'passing', 'key-metrics'].includes(selectedStatCategory) ? '1fr 400px' : '1fr',
          gap: ['attack', 'possession', 'defense', 'passing', 'key-metrics'].includes(selectedStatCategory) ? '2rem' : '0',
          alignItems: 'start'
        }}>
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            overflow: 'hidden'
          }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
            borderBottom: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`
          }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>
              {statCategories.find(cat => cat.id === selectedStatCategory)?.label}
            </span>
            <span style={{ 
              textAlign: 'center', 
              fontSize: '18px', 
              fontWeight: 700, 
              color: themeColors.accent 
            }}>
              POLK
            </span>
            <span style={{ 
              textAlign: 'center', 
              fontSize: '18px', 
              fontWeight: 700,
              color: isDarkTheme ? '#f8fafc' : '#0f172a' 
            }}>
              FSC
            </span>
          </div>
          
          {/* Stats Rows */}
          <div style={{ padding: '20px' }}>
            {selectedStatCategory === 'videos' ? (
              // Video links section
              <div>
                {getStatsForCategory(selectedStatCategory).map((video, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${isDarkTheme ? '#334155' : '#f1f5f9'}`
                  }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 600,
                      color: isDarkTheme ? '#f8fafc' : '#0f172a' 
                    }}>
                      {video.label}
                    </span>
                    <div>
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: themeColors.accent,
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = `${themeColors.accent}dd`;
                          e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = themeColors.accent;
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <span>▶</span>
                        Watch Video
                      </a>
                    </div>
                  </div>
                ))}
                {getStatsForCategory(selectedStatCategory).length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: isDarkTheme ? '#94a3b8' : '#64748b',
                    fontSize: '14px'
                  }}>
                    No videos available for this match
                  </div>
                )}
              </div>
            ) : selectedStatCategory === 'spider' ? (
              // Spider chart section
              <div>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '1rem',
                  color: isDarkTheme ? '#cbd5e1' : '#64748b',
                  fontSize: '14px'
                }}>
                  Performance Comparison: POLK vs FSC
                </div>
                
                {/* Legend */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '2rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: themeColors.accent,
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: themeColors.accent }}>
                      POLK
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#000000',
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#000000' }}>
                      FSC
                    </span>
                  </div>
                </div>
                
                <SpiderChart 
                  polkData={stats.fullGame.polk.normalized} 
                  opponentData={{
                    possession: stats.fullGame.opponent.possession / 100,
                    goals: stats.fullGame.opponent.goals / Math.max(stats.fullGame.polk.goals + stats.fullGame.opponent.goals, 1),
                    shotsOnTarget: stats.fullGame.opponent.shotsOnTarget / Math.max(stats.fullGame.polk.shotsOnTarget + stats.fullGame.opponent.shotsOnTarget, 1),
                    runsIntoBoxes: stats.fullGame.opponent.runsIntoBoxes / Math.max(stats.fullGame.polk.runsIntoBoxes + stats.fullGame.opponent.runsIntoBoxes, 1),
                    dribbles: stats.fullGame.opponent.dribbles / Math.max(stats.fullGame.polk.dribbles + stats.fullGame.opponent.dribbles, 1),
                    takeOns: stats.fullGame.opponent.takeOns / Math.max(stats.fullGame.polk.takeOns + stats.fullGame.opponent.takeOns, 1),
                    firstTouchSuccess: stats.fullGame.opponent.firstTouchSuccess / Math.max(stats.fullGame.polk.firstTouchSuccess + stats.fullGame.opponent.firstTouchSuccess, 1),
                    passingTotalDistance: stats.fullGame.opponent.passingTotalDistance / Math.max(stats.fullGame.polk.passingTotalDistance + stats.fullGame.opponent.passingTotalDistance, 1)
                  }}
                />
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginTop: '2rem'
                }}>
                  {[
                    { label: 'Possession', polk: stats.fullGame.polk.normalized.possession, fsc: stats.fullGame.opponent.possession / 100 },
                    { label: 'Goals', polk: stats.fullGame.polk.normalized.goals, fsc: stats.fullGame.opponent.goals / Math.max(stats.fullGame.polk.goals + stats.fullGame.opponent.goals, 1) },
                    { label: 'Shots On Target', polk: stats.fullGame.polk.normalized.shotsOnTarget, fsc: stats.fullGame.opponent.shotsOnTarget / Math.max(stats.fullGame.polk.shotsOnTarget + stats.fullGame.opponent.shotsOnTarget, 1) },
                    { label: 'Runs Into Boxes', polk: stats.fullGame.polk.normalized.runsIntoBoxes, fsc: stats.fullGame.opponent.runsIntoBoxes / Math.max(stats.fullGame.polk.runsIntoBoxes + stats.fullGame.opponent.runsIntoBoxes, 1) }
                  ].map((metric, index) => (
                    <div key={index} style={{
                      backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: isDarkTheme ? '#94a3b8' : '#64748b',
                        marginBottom: '8px',
                        textAlign: 'center'
                      }}>
                        {metric.label}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: themeColors.accent
                          }}>
                            {(metric.polk * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '10px', color: themeColors.accent }}>POLK</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#000000'
                          }}>
                            {(metric.fsc * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '10px', color: '#000000' }}>FSC</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Regular stats section
              getStatsForCategory(selectedStatCategory).map((stat, index) => (
                <StatRow 
                  key={index}
                  label={stat.label}
                  polk={stat.polk}
                  opponent={stat.opponent}
                  unit={stat.unit}
                  isPercentage={stat.isPercentage}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Performance Charts for Each Section */}
        {(['attack', 'possession', 'defense', 'passing', 'key-metrics'].includes(selectedStatCategory)) && (
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            padding: '20px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '16px',
              fontWeight: 600,
              color: isDarkTheme ? '#f8fafc' : '#0f172a'
            }}>
              {statCategories.find(cat => cat.id === selectedStatCategory)?.label} Performance
            </div>
            
            {/* Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: themeColors.accent,
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: themeColors.accent }}>
                  POLK
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#000000',
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000' }}>
                  FSC
                </span>
              </div>
            </div>
            
            {/* Category-Specific Spider Charts */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width={200} height={200} viewBox="0 0 200 200">
                {/* Grid circles */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, index) => (
                  <circle
                    key={`${selectedStatCategory}-grid-${index}`}
                    cx={100}
                    cy={100}
                    r={80 * level}
                    fill="none"
                    stroke={isDarkTheme ? '#334155' : '#e2e8f0'}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                ))}
                
                {/* Grid lines and data rendering based on category */}
                {(() => {
                  let metrics = [];
                  let polkData = [];
                  let fscData = [];
                  
                  switch(selectedStatCategory) {
                    case 'attack':
                      metrics = [
                        { label: 'Goals', angle: 0 },
                        { label: 'Shots', angle: Math.PI / 3 },
                        { label: 'On Target', angle: 2 * Math.PI / 3 },
                        { label: 'Runs', angle: Math.PI },
                        { label: 'Corners', angle: 4 * Math.PI / 3 },
                        { label: 'Crosses', angle: 5 * Math.PI / 3 }
                      ];
                      polkData = [
                        currentStats.polk.goals / Math.max(currentStats.polk.goals + currentStats.opponent.goals, 1),
                        currentStats.polk.shotsAttempted / Math.max(currentStats.polk.shotsAttempted + currentStats.opponent.shotsAttempted, 1),
                        currentStats.polk.shotsOnTarget / Math.max(currentStats.polk.shotsOnTarget + currentStats.opponent.shotsOnTarget, 1),
                        currentStats.polk.runsIntoBoxes / Math.max(currentStats.polk.runsIntoBoxes + currentStats.opponent.runsIntoBoxes, 1),
                        currentStats.polk.corners / Math.max(currentStats.polk.corners + currentStats.opponent.corners, 1),
                        currentStats.polk.dangerousCrosses / Math.max(currentStats.polk.dangerousCrosses + currentStats.opponent.dangerousCrosses, 1)
                      ];
                      fscData = [
                        currentStats.opponent.goals / Math.max(currentStats.polk.goals + currentStats.opponent.goals, 1),
                        currentStats.opponent.shotsAttempted / Math.max(currentStats.polk.shotsAttempted + currentStats.opponent.shotsAttempted, 1),
                        currentStats.opponent.shotsOnTarget / Math.max(currentStats.polk.shotsOnTarget + currentStats.opponent.shotsOnTarget, 1),
                        currentStats.opponent.runsIntoBoxes / Math.max(currentStats.polk.runsIntoBoxes + currentStats.opponent.runsIntoBoxes, 1),
                        currentStats.opponent.corners / Math.max(currentStats.polk.corners + currentStats.opponent.corners, 1),
                        currentStats.opponent.dangerousCrosses / Math.max(currentStats.polk.dangerousCrosses + currentStats.opponent.dangerousCrosses, 1)
                      ];
                      break;
                      
                    case 'possession':
                      metrics = [
                        { label: 'Dribbles', angle: 0 },
                        { label: 'P. Dribbles', angle: Math.PI / 2.5 },
                        { label: 'Take Ons', angle: 2 * Math.PI / 2.5 },
                        { label: 'First Touch', angle: Math.PI },
                        { label: 'Success Rate', angle: 4 * Math.PI / 2.5 }
                      ];
                      polkData = [
                        currentStats.polk.dribbles / Math.max(currentStats.polk.dribbles + currentStats.opponent.dribbles, 1),
                        currentStats.polk.penetratingDribbles / Math.max(currentStats.polk.penetratingDribbles + currentStats.opponent.penetratingDribbles, 1),
                        currentStats.polk.takeOns / Math.max(currentStats.polk.takeOns + currentStats.opponent.takeOns, 1),
                        currentStats.polk.firstTouchSuccess / Math.max(currentStats.polk.firstTouchSuccess + currentStats.opponent.firstTouchSuccess, 1),
                        currentStats.polk.firstTouchSuccessRate / Math.max(currentStats.polk.firstTouchSuccessRate + currentStats.opponent.firstTouchSuccessRate, 1)
                      ];
                      fscData = [
                        currentStats.opponent.dribbles / Math.max(currentStats.polk.dribbles + currentStats.opponent.dribbles, 1),
                        currentStats.opponent.penetratingDribbles / Math.max(currentStats.polk.penetratingDribbles + currentStats.opponent.penetratingDribbles, 1),
                        currentStats.opponent.takeOns / Math.max(currentStats.polk.takeOns + currentStats.opponent.takeOns, 1),
                        currentStats.opponent.firstTouchSuccess / Math.max(currentStats.polk.firstTouchSuccess + currentStats.opponent.firstTouchSuccess, 1),
                        currentStats.opponent.firstTouchSuccessRate / Math.max(currentStats.polk.firstTouchSuccessRate + currentStats.opponent.firstTouchSuccessRate, 1)
                      ];
                      break;
                      
                    case 'defense':
                      metrics = [
                        { label: 'Tackles', angle: 0 },
                        { label: 'Free Kicks', angle: 2 * Math.PI / 3 },
                        { label: 'Offsides', angle: 4 * Math.PI / 3 }
                      ];
                      polkData = [
                        currentStats.polk.tackles / Math.max(currentStats.polk.tackles + currentStats.opponent.tackles, 1),
                        currentStats.polk.freeKicks / Math.max(currentStats.polk.freeKicks + currentStats.opponent.freeKicks, 1),
                        currentStats.polk.offsides / Math.max(currentStats.polk.offsides + currentStats.opponent.offsides, 1)
                      ];
                      fscData = [
                        currentStats.opponent.tackles / Math.max(currentStats.polk.tackles + currentStats.opponent.tackles, 1),
                        currentStats.opponent.freeKicks / Math.max(currentStats.polk.freeKicks + currentStats.opponent.freeKicks, 1),
                        currentStats.opponent.offsides / Math.max(currentStats.polk.offsides + currentStats.opponent.offsides, 1)
                      ];
                      break;
                      
                    case 'passing':
                      metrics = [
                        { label: 'Attempted', angle: 0 },
                        { label: 'Success', angle: Math.PI / 3 },
                        { label: 'Rate', angle: 2 * Math.PI / 3 },
                        { label: 'Distance', angle: Math.PI },
                        { label: 'Avg Dist', angle: 4 * Math.PI / 3 },
                        { label: 'Velocity', angle: 5 * Math.PI / 3 }
                      ];
                      polkData = [
                        currentStats.polk.passesAttempted / Math.max(currentStats.polk.passesAttempted + currentStats.opponent.passesAttempted, 1),
                        currentStats.polk.passesSuccess / Math.max(currentStats.polk.passesSuccess + currentStats.opponent.passesSuccess, 1),
                        currentStats.polk.passingSuccessRate / Math.max(currentStats.polk.passingSuccessRate + currentStats.opponent.passingSuccessRate, 1),
                        currentStats.polk.passingTotalDistance / Math.max(currentStats.polk.passingTotalDistance + currentStats.opponent.passingTotalDistance, 1),
                        currentStats.polk.passingAverageDistance / Math.max(currentStats.polk.passingAverageDistance + currentStats.opponent.passingAverageDistance, 1),
                        currentStats.polk.passingAverageVelocity / Math.max(currentStats.polk.passingAverageVelocity + currentStats.opponent.passingAverageVelocity, 1)
                      ];
                      fscData = [
                        currentStats.opponent.passesAttempted / Math.max(currentStats.polk.passesAttempted + currentStats.opponent.passesAttempted, 1),
                        currentStats.opponent.passesSuccess / Math.max(currentStats.polk.passesSuccess + currentStats.opponent.passesSuccess, 1),
                        currentStats.opponent.passingSuccessRate / Math.max(currentStats.polk.passingSuccessRate + currentStats.opponent.passingSuccessRate, 1),
                        currentStats.opponent.passingTotalDistance / Math.max(currentStats.polk.passingTotalDistance + currentStats.opponent.passingTotalDistance, 1),
                        currentStats.opponent.passingAverageDistance / Math.max(currentStats.polk.passingAverageDistance + currentStats.opponent.passingAverageDistance, 1),
                        currentStats.opponent.passingAverageVelocity / Math.max(currentStats.polk.passingAverageVelocity + currentStats.opponent.passingAverageVelocity, 1)
                      ];
                      break;
                      
                    case 'key-metrics':
                      metrics = [
                        { label: 'Distance', angle: 0 },
                        { label: 'Possession', angle: Math.PI }
                      ];
                      polkData = [
                        currentStats.polk.totalTeamDistance / Math.max(currentStats.polk.totalTeamDistance + currentStats.opponent.totalTeamDistance, 1),
                        currentStats.polk.possession / 100
                      ];
                      fscData = [
                        currentStats.opponent.totalTeamDistance / Math.max(currentStats.polk.totalTeamDistance + currentStats.opponent.totalTeamDistance, 1),
                        currentStats.opponent.possession / 100
                      ];
                      break;
                  }
                  
                  const angleStep = (2 * Math.PI) / metrics.length;
                  
                  return (
                    <>
                      {/* Grid lines */}
                      {metrics.map((metric, index) => {
                        const x = 100 + Math.cos(metric.angle - Math.PI / 2) * 80;
                        const y = 100 + Math.sin(metric.angle - Math.PI / 2) * 80;
                        return (
                          <line
                            key={`${selectedStatCategory}-line-${index}`}
                            x1={100}
                            y1={100}
                            x2={x}
                            y2={y}
                            stroke={isDarkTheme ? '#334155' : '#e2e8f0'}
                            strokeWidth="1"
                            opacity="0.5"
                          />
                        );
                      })}
                      
                      {/* FSC polygon */}
                      <polygon
                        points={fscData.map((value, index) => {
                          const x = 100 + Math.cos(metrics[index].angle - Math.PI / 2) * 80 * value;
                          const y = 100 + Math.sin(metrics[index].angle - Math.PI / 2) * 80 * value;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="#00000020"
                        stroke="#000000"
                        strokeWidth="2"
                      />
                      
                      {/* POLK polygon */}
                      <polygon
                        points={polkData.map((value, index) => {
                          const x = 100 + Math.cos(metrics[index].angle - Math.PI / 2) * 80 * value;
                          const y = 100 + Math.sin(metrics[index].angle - Math.PI / 2) * 80 * value;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill={`${themeColors.accent}30`}
                        stroke={themeColors.accent}
                        strokeWidth="2"
                      />
                      
                      {/* Labels */}
                      {metrics.map((metric, index) => {
                        const labelRadius = 95;
                        const x = 100 + Math.cos(metric.angle - Math.PI / 2) * labelRadius;
                        const y = 100 + Math.sin(metric.angle - Math.PI / 2) * labelRadius;
                        
                        return (
                          <text
                            key={`${selectedStatCategory}-label-${index}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="8"
                            fill={isDarkTheme ? '#cbd5e1' : '#64748b'}
                            fontWeight="500"
                          >
                            {metric.label}
                          </text>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  };

  // Player Form Component
  const PlayerForm = ({ player, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: player?.name || '',
      position: player?.position || 'ST',
      jerseyNumber: player?.jerseyNumber || '',
      year: player?.year || 'Freshman',
      hometown: player?.hometown || '',
      height: player?.height || '',
      goals: player?.goals || 0,
      assists: player?.assists || 0,
      appearances: player?.appearances || 0
    });
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '24px',
            color: isDarkTheme ? '#f8fafc' : '#0f172a'
          }}>
            {player ? 'Edit Player' : 'Add New Player'}
          </h3>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...player,
              ...formData,
              id: player?.id || Date.now(),
              goals: parseInt(formData.goals) || 0,
              assists: parseInt(formData.assists) || 0,
              appearances: parseInt(formData.appearances) || 0,
              jerseyNumber: parseInt(formData.jerseyNumber) || 0
            });
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Player Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Jersey Number
                </label>
                <input
                  type="number"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({...formData, jerseyNumber: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                  min="0"
                  max="99"
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Position
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                >
                  <option value="GK">Goalkeeper (GK)</option>
                  <option value="CB">Centre Back (CB)</option>
                  <option value="LB">Left Back (LB)</option>
                  <option value="RB">Right Back (RB)</option>
                  <option value="LWB">Left Wing Back (LWB)</option>
                  <option value="RWB">Right Wing Back (RWB)</option>
                  <option value="CDM">Defensive Mid (CDM)</option>
                  <option value="CM">Centre Mid (CM)</option>
                  <option value="CAM">Attacking Mid (CAM)</option>
                  <option value="LM">Left Mid (LM)</option>
                  <option value="RM">Right Mid (RM)</option>
                  <option value="LW">Left Wing (LW)</option>
                  <option value="RW">Right Wing (RW)</option>
                  <option value="ST">Striker (ST)</option>
                  <option value="CF">Centre Forward (CF)</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                >
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Height
                </label>
                <input
                  type="text"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  placeholder="e.g., 5'8&quot;"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Hometown
                </label>
                <input
                  type="text"
                  value={formData.hometown}
                  onChange={(e) => setFormData({...formData, hometown: e.target.value})}
                  placeholder="e.g., Tampa, FL"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Goals
                </label>
                <input
                  type="number"
                  value={formData.goals}
                  onChange={(e) => setFormData({...formData, goals: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                  min="0"
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Assists
                </label>
                <input
                  type="number"
                  value={formData.assists}
                  onChange={(e) => setFormData({...formData, assists: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                  min="0"
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Appearances
                </label>
                <input
                  type="number"
                  value={formData.appearances}
                  onChange={(e) => setFormData({...formData, appearances: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                  min="0"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '12px 20px',
                  border: `1px solid ${isDarkTheme ? '#475569' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: isDarkTheme ? '#94a3b8' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: themeColors.accent,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {player ? 'Update Player' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Fixture Form Component
  const FixtureForm = ({ fixture, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      opponent: fixture?.opponent || '',
      date: fixture?.date ? fixture.date.substring(0, 16) : '',
      venue: fixture?.venue || 'Polk State Soccer Field',
      type: fixture?.type || 'HOME',
      competition: fixture?.competition || 'FCSAA League',
      status: fixture?.status || 'SCHEDULED',
      videoLink: fixture?.videoLink || '',
      hasVideo: fixture?.hasVideo || false
    });
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '24px',
            color: isDarkTheme ? '#f8fafc' : '#0f172a'
          }}>
            {fixture ? 'Edit Fixture' : 'Add New Fixture'}
          </h3>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...fixture,
              ...formData,
              id: fixture?.id || Date.now(),
              hasVideo: formData.videoLink.trim() !== '',
              videoLinks: formData.videoLink.trim() !== '' ? { 
                match: formData.videoLink 
              } : undefined
            });
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isDarkTheme ? '#f8fafc' : '#0f172a'
              }}>
                Opponent
              </label>
              <input
                type="text"
                value={formData.opponent}
                onChange={(e) => setFormData({...formData, opponent: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isDarkTheme ? '#f8fafc' : '#0f172a'
              }}>
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                >
                  <option value="HOME">Home</option>
                  <option value="AWAY">Away</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                    color: isDarkTheme ? '#f8fafc' : '#0f172a',
                    fontSize: '14px'
                  }}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO CONTEST">No Contest</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isDarkTheme ? '#f8fafc' : '#0f172a'
              }}>
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isDarkTheme ? '#f8fafc' : '#0f172a'
              }}>
                Competition
              </label>
              <select
                value={formData.competition}
                onChange={(e) => setFormData({...formData, competition: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#334155' : '#ffffff',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a',
                  fontSize: '14px'
                }}
              >
                <option value="FCSAA League">FCSAA League</option>
                <option value="FCSAA Pre-Season">FCSAA Pre-Season</option>
                <option value="Conference">Conference</option>
                <option value="Tournament">Tournament</option>
                <option value="Friendly">Friendly</option>
              </select>
            </div>
            
            {/* Video Upload Section */}
            <div style={{ 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
              borderRadius: '8px',
              border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.accent }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: isDarkTheme ? '#f8fafc' : '#0f172a',
                  margin: 0
                }}>
                  Video Analysis
                </h4>
              </div>
              
              <div style={{
                fontSize: '13px',
                color: isDarkTheme ? '#cbd5e1' : '#64748b',
                marginBottom: '12px'
              }}>
                Upload video link for Gamescope analysis and result viewing
              </div>
              
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isDarkTheme ? '#f8fafc' : '#0f172a'
              }}>
                Video Link (Optional)
              </label>
              <input
                type="url"
                value={formData.videoLink}
                onChange={(e) => setFormData({
                  ...formData, 
                  videoLink: e.target.value,
                  hasVideo: e.target.value.trim() !== ''
                })}
                placeholder="https://example.com/match-video.mp4"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDarkTheme ? '#334155' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a',
                  fontSize: '14px'
                }}
              />
              
              {formData.videoLink && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  Video ready for analysis submission
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '12px 20px',
                  border: `1px solid ${isDarkTheme ? '#475569' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: isDarkTheme ? '#94a3b8' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: themeColors.accent,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {fixture ? 'Update Fixture' : 'Add Fixture'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Fixtures Management Page Component
  const renderFixturesPage = () => {
    
    
    const myTeam = teams.find(t => t.name === currentUser.team);
    const allFixtures = fixtureData[myTeam?.id] || [];
    
    // Group fixtures by status
    const completed = allFixtures.filter(f => f.status === 'COMPLETED' || f.status === 'NO CONTEST');
    const scheduled = allFixtures.filter(f => f.status === 'SCHEDULED');
    
    const FixtureCard = ({ fixture, isScheduled = false }) => (
      <div
        style={{
          backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Edit button for coaches */}
        <button
          onClick={() => setSelectedFixture(fixture)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: isDarkTheme ? '#94a3b8' : '#6b7280',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          title="Edit fixture"
        >
          ✏️
        </button>
        
        {/* Match Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: isDarkTheme ? '#f8fafc' : '#0f172a'
          }}>
            {fixture.type === 'HOME' ? 'vs' : 'at'} {fixture.opponent}
          </div>
          
          {!isScheduled && (
            <>
              {fixture.status === 'COMPLETED' && fixture.score && (
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 
                    ((fixture.type === 'HOME' && fixture.score.home > fixture.score.away) ||
                     (fixture.type === 'AWAY' && fixture.score.away > fixture.score.home)) 
                      ? '#22c55e' : '#ef4444',
                  padding: '4px 8px',
                  backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                  borderRadius: '6px'
                }}>
                  {fixture.type === 'HOME' ? 
                    `${fixture.score.home}-${fixture.score.away}` : 
                    `${fixture.score.away}-${fixture.score.home}`}
                </div>
              )}
              
              {fixture.status === 'NO CONTEST' && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#f59e0b',
                  backgroundColor: '#fef3c7',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  NO CONTEST
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Date and Time */}
        <div style={{
          fontSize: '14px',
          color: isDarkTheme ? '#cbd5e1' : '#64748b',
          marginBottom: '8px'
        }}>
          📅 {new Date(fixture.date).toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        
        {/* Venue */}
        <div style={{
          fontSize: '13px',
          color: isDarkTheme ? '#94a3b8' : '#6b7280',
          marginBottom: '8px'
        }}>
          📍 {fixture.venue}
        </div>
        
        {/* Competition */}
        <div style={{
          fontSize: '12px'
        }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            backgroundColor: fixture.competition === 'FCSAA League' ? '#22c55e' : 
                           fixture.competition === 'Tournament' ? '#8b5cf6' : '#6b7280',
            color: 'white',
            fontWeight: 500
          }}>
            {fixture.competition}
          </span>
        </div>
        
        {/* Notes for special cases */}
        {fixture.notes && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: isDarkTheme ? '#94a3b8' : '#64748b',
            fontStyle: 'italic'
          }}>
            {fixture.notes}
          </div>
        )}
        
        {/* Video Status */}
        {fixture.hasVideo && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#22c55e',
            fontWeight: 500
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video uploaded for analysis
          </div>
        )}
        
        {!fixture.hasVideo && fixture.status === 'COMPLETED' && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: isDarkTheme ? '#94a3b8' : '#64748b'
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            No video uploaded
          </div>
        )}
      </div>
    );
    
    return (
      <div style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        overflowY: 'auto',
        backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: isDarkTheme ? '#f8fafc' : '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Icon name="calendar" style={{ color: themeColors.accent }} />
              Fixtures Management
            </h1>
            <h2 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
              color: themeColors.accent
            }}>
              WOMEN'S SOCCER
            </h2>
            <div style={{
              color: isDarkTheme ? '#cbd5e1' : '#64748b',
              fontSize: '14px'
            }}>
              Manage your team's schedule and match results
            </div>
          </div>
          
          <button
            onClick={() => setIsAddingNew(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: themeColors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Add Fixture
          </button>
        </div>

        {/* Season Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: themeColors.accent,
              marginBottom: '8px'
            }}>
              {allFixtures.length}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Total Fixtures
            </div>
          </div>
          
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#22c55e',
              marginBottom: '8px'
            }}>
              {completed.length}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Completed
            </div>
          </div>
          
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#3b82f6',
              marginBottom: '8px'
            }}>
              {scheduled.length}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Scheduled
            </div>
          </div>
          
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#f59e0b',
              marginBottom: '8px'
            }}>
              {allFixtures.filter(f => f.type === 'HOME').length}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Home Games
            </div>
          </div>
        </div>

        {/* Fixtures Grouped by Competition */}
        {(() => {
          // Group all fixtures by competition
          const fixturesByCompetition = allFixtures.reduce((groups, fixture) => {
            const competition = fixture.competition || 'Other';
            if (!groups[competition]) {
              groups[competition] = [];
            }
            groups[competition].push(fixture);
            return groups;
          }, {});

          // Order competitions logically (current season first, then pre-season)
          const competitionOrder = ['FCSAA League', 'FCSAA Pre-Season', 'Conference', 'Tournament', 'Friendly', 'Other'];
          const sortedCompetitions = Object.keys(fixturesByCompetition).sort((a, b) => {
            const indexA = competitionOrder.indexOf(a);
            const indexB = competitionOrder.indexOf(b);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          });

          const getCompetitionColor = (competition) => {
            switch(competition) {
              case 'FCSAA League': return '#22c55e';
              case 'FCSAA Pre-Season': return '#3b82f6';
              case 'Conference': return '#8b5cf6';
              case 'Tournament': return '#f59e0b';
              case 'Friendly': return '#06b6d4';
              default: return '#6b7280';
            }
          };

          const getCompetitionIcon = (competition) => {
            switch(competition) {
              case 'FCSAA League': return '🏆';
              case 'FCSAA Pre-Season': return '⚽';
              case 'Conference': return '🎯';
              case 'Tournament': return '🏅';
              case 'Friendly': return '🤝';
              default: return '📅';
            }
          };

          if (allFixtures.length === 0) {
            return (
              <div style={{
                backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: isDarkTheme ? '#94a3b8' : '#64748b'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  📅
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: isDarkTheme ? '#f8fafc' : '#0f172a'
                }}>
                  No fixtures scheduled yet
                </div>
                <div style={{ fontSize: '14px' }}>
                  Add your first fixture to get started with your season schedule!
                </div>
              </div>
            );
          }

          return sortedCompetitions.map(competition => {
            const competitionFixtures = fixturesByCompetition[competition];
            const scheduledCount = competitionFixtures.filter(f => f.status === 'SCHEDULED').length;
            const completedCount = competitionFixtures.filter(f => f.status === 'COMPLETED' || f.status === 'NO CONTEST').length;
            
            return (
              <div key={competition} style={{ marginBottom: '40px' }}>
                {/* Competition Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  padding: '16px 20px',
                  backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
                  borderLeft: `4px solid ${getCompetitionColor(competition)}`,
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '24px' }}>
                      {getCompetitionIcon(competition)}
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: getCompetitionColor(competition),
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        {competition}
                      </h3>
                      <div style={{
                        fontSize: '14px',
                        color: isDarkTheme ? '#cbd5e1' : '#64748b'
                      }}>
                        {competitionFixtures.length} total • {completedCount} completed • {scheduledCount} scheduled
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {completedCount > 0 && (
                      <div style={{
                        backgroundColor: '#22c55e',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {completedCount} completed
                      </div>
                    )}
                    {scheduledCount > 0 && (
                      <div style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {scheduledCount} upcoming
                      </div>
                    )}
                  </div>
                </div>

                {/* Competition Fixtures */}
                <div>
                  {/* Upcoming matches first */}
                  {(() => {
                    const upcomingMatches = competitionFixtures
                      .filter(f => f.status === 'SCHEDULED')
                      .sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    const completedMatches = competitionFixtures
                      .filter(f => f.status === 'COMPLETED' || f.status === 'NO CONTEST')
                      .sort((a, b) => new Date(b.date) - new Date(a.date));

                    return (
                      <>
                        {/* Upcoming section */}
                        {upcomingMatches.length > 0 && (
                          <div style={{ marginBottom: '24px' }}>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: isDarkTheme ? '#f8fafc' : '#0f172a',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '3px',
                                height: '16px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '2px'
                              }}></div>
                              Upcoming ({upcomingMatches.length})
                            </h4>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '16px'
                            }}>
                              {upcomingMatches.map(fixture => (
                                <FixtureCard key={fixture.id} fixture={fixture} isScheduled={true} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed section */}
                        {completedMatches.length > 0 && (
                          <div>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: isDarkTheme ? '#f8fafc' : '#0f172a',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '3px',
                                height: '16px',
                                backgroundColor: '#22c55e',
                                borderRadius: '2px'
                              }}></div>
                              Completed ({completedMatches.length})
                            </h4>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '16px'
                            }}>
                              {completedMatches.map(fixture => (
                                <FixtureCard key={fixture.id} fixture={fixture} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          });
        })()}

        {/* Modals */}
        {isAddingNew && (
          <FixtureForm
            onSave={(newFixture) => {
              console.log('Adding new fixture:', newFixture);
              setIsAddingNew(false);
            }}
            onCancel={() => setIsAddingNew(false)}
          />
        )}
        
        {selectedFixture && (
          <FixtureForm
            fixture={selectedFixture}
            onSave={(updatedFixture) => {
              console.log('Updating fixture:', updatedFixture);
              setSelectedFixture(null);
            }}
            onCancel={() => setSelectedFixture(null)}
          />
        )}
      </div>
    );
  };
  const renderMyTeamPage = () => {
    const myTeam = teams.find(t => t.name === currentUser.team);
    const squad = squadData[myTeam?.id] || [];
    
    // Group players by position
    const playersByPosition = {
      'GK': squad.filter(p => p.position === 'GK'),
      'Defense': squad.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)),
      'Midfield': squad.filter(p => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p.position)),
      'Attack': squad.filter(p => ['ST', 'LW', 'RW', 'CF'].includes(p.position))
    };
    
    const getPositionColor = (position) => {
      if (position === 'GK') return '#f59e0b'; // amber
      if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return '#ef4444'; // red
      if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position)) return '#22c55e'; // green
      if (['ST', 'LW', 'RW', 'CF'].includes(position)) return '#8b5cf6'; // purple
      return '#6b7280'; // gray
    };
    
    const PlayerCard = ({ player }) => (
      <div style={{
        backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer',
        ...(player.isCurrent && {
          border: `2px solid ${themeColors.accent}`,
          backgroundColor: isDarkTheme ? `${themeColors.accent}10` : `${themeColors.accent}05`
        })
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.02)';
        e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = 'none';
      }}
      >
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPlayer(player);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: isDarkTheme ? '#94a3b8' : '#6b7280',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          title="Edit player"
        >
          ✏️
        </button>

        {/* Current user badge */}
        {player.isCurrent && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '40px',
            backgroundColor: themeColors.accent,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 600
          }}>
            YOU
          </div>
        )}
        
        {/* Jersey Number */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: getPositionColor(player.position),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          {player.jerseyNumber}
        </div>
        
        {/* Player Name */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: isDarkTheme ? '#f8fafc' : '#0f172a',
          marginBottom: '8px',
          lineHeight: '1.2'
        }}>
          {player.name}
        </h3>
        
        {/* Position and Year */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '16px',
            backgroundColor: getPositionColor(player.position),
            color: 'white',
            fontSize: '12px',
            fontWeight: 600
          }}>
            {player.position}
          </span>
          <span style={{
            color: isDarkTheme ? '#cbd5e1' : '#64748b',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {player.year}
          </span>
        </div>
        
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: themeColors.accent
            }}>
              {player.goals}
            </div>
            <div style={{
              fontSize: '12px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Goals
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#22c55e'
            }}>
              {player.assists}
            </div>
            <div style={{
              fontSize: '12px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Assists
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: isDarkTheme ? '#f8fafc' : '#0f172a'
            }}>
              {player.appearances}
            </div>
            <div style={{
              fontSize: '12px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Apps
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div style={{
          fontSize: '12px',
          color: isDarkTheme ? '#94a3b8' : '#64748b',
          borderTop: `1px solid ${isDarkTheme ? '#334155' : '#f1f5f9'}`,
          paddingTop: '12px'
        }}>
          <div>{player.height} • {player.hometown}</div>
        </div>
      </div>
    );
    
    return (
      <div style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        overflowY: 'auto',
        backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: isDarkTheme ? '#f8fafc' : '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: themeColors.accent }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="m22 21-3-3m0-8.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/>
              </svg>
              Squad
            </h1>
            <h2 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
              color: themeColors.accent
            }}>
              WOMEN'S SOCCER
            </h2>
            <div style={{
              color: isDarkTheme ? '#cbd5e1' : '#64748b',
              fontSize: '14px'
            }}>
              {squad.length} players • Coach: {myTeam?.coach} • Assistant: {myTeam?.assistantCoach}
            </div>
          </div>
          
          <button
            onClick={() => setIsAddingNewPlayer(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: themeColors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Add Player
          </button>
        </div>

        {/* Squad Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: themeColors.accent,
              marginBottom: '8px'
            }}>
              {squad.reduce((sum, p) => sum + p.goals, 0)}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Total Goals
            </div>
          </div>
          
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#22c55e',
              marginBottom: '8px'
            }}>
              {squad.reduce((sum, p) => sum + p.assists, 0)}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Total Assists
            </div>
          </div>
          
          <div style={{
            backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: isDarkTheme ? '#f8fafc' : '#0f172a',
              marginBottom: '8px'
            }}>
              {Math.round(squad.reduce((sum, p) => sum + p.appearances, 0) / squad.length)}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              Avg Appearances
            </div>
          </div>
        </div>

        {/* Squad by Position */}
        {Object.entries(playersByPosition).map(([positionGroup, players]) => (
          players.length > 0 && (
            <div key={positionGroup} style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: isDarkTheme ? '#f8fafc' : '#0f172a',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '4px',
                  height: '20px',
                  backgroundColor: themeColors.accent,
                  borderRadius: '2px'
                }}></div>
                {positionGroup}
                <span style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: isDarkTheme ? '#94a3b8' : '#64748b'
                }}>
                  ({players.length})
                </span>
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {players
                  .sort((a, b) => b.appearances - a.appearances)
                  .map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
              </div>
            </div>
          )
        ))}

        {/* Modals */}
        {isAddingNewPlayer && (
          <PlayerForm
            onSave={(newPlayer) => {
              console.log('Adding new player:', newPlayer);
              setIsAddingNewPlayer(false);
            }}
            onCancel={() => setIsAddingNewPlayer(false)}
          />
        )}
        
        {selectedPlayer && (
          <PlayerForm
            player={selectedPlayer}
            onSave={(updatedPlayer) => {
              console.log('Updating player:', updatedPlayer);
              setSelectedPlayer(null);
            }}
            onCancel={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    );
  };

  // Main Fixtures & Videos Component
  const renderPageContent = () => {
    // Show fixtures management page
    if (activeNavItem === 'fixtures') {
      return renderFixturesPage();
    }
    
    // Show match details page if selected
    if (activeNavItem === 'match-details' && selectedMatchDetails) {
      return renderMatchDetailsPage();
    }
    
    // Show My Team/Squad page
    if (activeNavItem === 'my-team') {
      return renderMyTeamPage();
    }
    
    const myTeam = teams.find(t => t.name === currentUser.team);
    const myFixtures = fixtureData[myTeam?.id] || [];
    const myUpcomingFixtures = upcomingFixtures[myTeam?.id] || [];
    
    return (
      <div style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        overflowY: 'auto',
        backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: isDarkTheme ? '#f8fafc' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: themeColors.accent }}>
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M17 12h-2l-2 5-2-10-2 5H7"/>
            </svg>
            Results
          </h1>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: 600,
            marginBottom: '0.25rem',
            color: themeColors.accent
          }}>
            WOMEN'S SOCCER
          </h2>
          <div style={{
            color: isDarkTheme ? '#cbd5e1' : '#64748b',
            fontSize: '14px'
          }}>
            • Coach: Dee Shivraman • Assistant: Brian McNulty
          </div>
        </div>

        {/* Next Match Highlight */}
        {myUpcomingFixtures && myUpcomingFixtures[0] && (
          <div style={{
            background: `linear-gradient(135deg, ${themeColors.accent}15, ${themeColors.accent}05)`,
            border: `1px solid ${themeColors.accent}40`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                padding: '6px 12px',
                backgroundColor: themeColors.accent,
                color: 'white',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                NEXT MATCH
              </div>
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: isDarkTheme ? '#f8fafc' : '#0f172a',
              margin: '0 0 8px 0'
            }}>
              vs {myUpcomingFixtures[0].opponent}
            </h2>
            
            <div style={{
              fontSize: '16px',
              color: isDarkTheme ? '#cbd5e1' : '#64748b',
              marginBottom: '12px'
            }}>
              {new Date(myUpcomingFixtures[0].date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            <div style={{
              fontSize: '14px',
              color: isDarkTheme ? '#94a3b8' : '#64748b'
            }}>
              📍 {myUpcomingFixtures[0].venue}
            </div>
          </div>
        )}

        {/* Recent Matches with Videos - Grouped by Competition */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: isDarkTheme ? '#f8fafc' : '#0f172a',
            marginBottom: '24px'
          }}>
            Match Results
          </h3>

          {(() => {
            // Group completed fixtures by competition
            const completedFixtures = myFixtures
              .filter(f => f.status === 'COMPLETED' || f.status === 'NO CONTEST')
              .sort((a, b) => new Date(b.date) - new Date(a.date));
              
            const fixturesByCompetition = completedFixtures.reduce((groups, fixture) => {
              const competition = fixture.competition || 'Other';
              if (!groups[competition]) {
                groups[competition] = [];
              }
              groups[competition].push(fixture);
              return groups;
            }, {});

            // Order competitions logically (current season first, then pre-season)
            const competitionOrder = ['FCSAA League', 'FCSAA Pre-Season', 'Conference', 'Tournament', 'Friendly', 'Other'];
            const sortedCompetitions = Object.keys(fixturesByCompetition).sort((a, b) => {
              const indexA = competitionOrder.indexOf(a);
              const indexB = competitionOrder.indexOf(b);
              return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });

            const getCompetitionColor = (competition) => {
              switch(competition) {
                case 'FCSAA League': return '#22c55e';
                case 'FCSAA Pre-Season': return '#3b82f6';
                case 'Conference': return '#8b5cf6';
                case 'Tournament': return '#f59e0b';
                case 'Friendly': return '#06b6d4';
                default: return '#6b7280';
              }
            };

            const getCompetitionIcon = (competition) => {
              switch(competition) {
                case 'FCSAA League': return '🏆';
                case 'FCSAA Pre-Season': return '⚽';
                case 'Conference': return '🎯';
                case 'Tournament': return '🏅';
                case 'Friendly': return '🤝';
                default: return '📅';
              }
            };

            return sortedCompetitions.map(competition => (
              <div key={competition} style={{ marginBottom: '32px' }}>
                {/* Competition Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px 0',
                  borderBottom: `2px solid ${getCompetitionColor(competition)}20`
                }}>
                  <div style={{
                    fontSize: '18px'
                  }}>
                    {getCompetitionIcon(competition)}
                  </div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: getCompetitionColor(competition),
                    margin: 0
                  }}>
                    {competition}
                  </h4>
                  <div style={{
                    backgroundColor: getCompetitionColor(competition),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {fixturesByCompetition[competition].length} {fixturesByCompetition[competition].length === 1 ? 'match' : 'matches'}
                  </div>
                </div>

                {/* Competition Matches */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {fixturesByCompetition[competition].map(fixture => (
                    <div
                      key={fixture.id}
                      onClick={() => {
                        const stats = matchStats[fixture.id];
                        if (stats) {
                          setSelectedMatchDetails({ fixture, stats });
                          setActiveNavItem('match-details');
                        }
                      }}
                      style={{
                        background: isDarkTheme ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
                        borderLeft: `4px solid ${getCompetitionColor(competition)}`,
                        borderRadius: '8px',
                        padding: '16px',
                        cursor: matchStats[fixture.id] ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (matchStats[fixture.id]) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (matchStats[fixture.id]) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {/* Video Badge */}
                      {fixture.hasVideo && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (fixture.videoLinks?.match) {
                              window.open(fixture.videoLinks.match, '_blank');
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: '#22c55e',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#16a34a';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#22c55e';
                            e.target.style.transform = 'scale(1)';
                          }}
                          title="Watch video"
                        >
                          ▶
                        </div>
                      )}

                      {/* Stats Badge */}
                      {matchStats[fixture.id] && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: fixture.hasVideo ? '52px' : '12px',
                          backgroundColor: themeColors.accent,
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'white'
                        }}>
                          📊
                        </div>
                      )}

                      {/* Match Info */}
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isDarkTheme ? '#f8fafc' : '#0f172a',
                        marginBottom: '8px'
                      }}>
                        vs {fixture.opponent}
                      </div>

                      {/* Score or Status */}
                      {fixture.status === 'NO CONTEST' ? (
                        <div style={{
                          fontSize: '14px',
                          color: '#f59e0b',
                          marginBottom: '8px'
                        }}>
                          NO CONTEST
                          {fixture.notes && (
                            <div style={{
                              fontSize: '12px',
                              color: isDarkTheme ? '#94a3b8' : '#64748b',
                              marginTop: '4px'
                            }}>
                              {fixture.notes}
                            </div>
                          )}
                        </div>
                      ) : fixture.status === 'UNKNOWN' ? (
                        <div style={{
                          fontSize: '14px',
                          color: isDarkTheme ? '#94a3b8' : '#64748b',
                          marginBottom: '8px'
                        }}>
                          UNKNOWN
                        </div>
                      ) : fixture.score && (
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 
                            ((fixture.type === 'HOME' && fixture.score.home > fixture.score.away) ||
                             (fixture.type === 'AWAY' && fixture.score.away > fixture.score.home)) 
                              ? '#22c55e' : themeColors.accent,
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {fixture.type === 'HOME' ? 
                            `${fixture.score.home}-${fixture.score.away}` : 
                            `${fixture.score.away}-${fixture.score.home}`}
                          {fixture.score && 
                           ((fixture.type === 'HOME' && fixture.score.home >= 5 && fixture.score.home > fixture.score.away) ||
                            (fixture.type === 'AWAY' && fixture.score.away >= 5 && fixture.score.away > fixture.score.home)) && (
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: '#22c55e',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              boxShadow: 'none'
                            }}>
                              BIG WIN!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      <div style={{
                        fontSize: '12px',
                        color: isDarkTheme ? '#94a3b8' : '#64748b',
                        marginBottom: '4px'
                      }}>
                        {new Date(fixture.date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      
                      {/* Venue */}
                      <div style={{
                        fontSize: '11px',
                        color: isDarkTheme ? '#94a3b8' : '#64748b'
                      }}>
                        📍 {fixture.venue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    );
  };

  // Main App Component
  return (
    <div style={baseStyles.app}>
      <SidebarComponent />
      
      {/* Mobile overlay for sidebar */}
      {isMobile && !sidebarHidden && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 150
          }}
        />
      )}

      <main style={baseStyles.mainContent}>
        <HeaderComponent />
        {renderPageContent()}
      </main>
    </div>
  );
};

export default GameScopeAngularApp;