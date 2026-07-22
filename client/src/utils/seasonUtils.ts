import { Team, Club, Competition } from "@shared/schema";

// Get the effective season start month for a team/competition
export function getEffectiveSeasonStartMonth(
  team?: Team,
  club?: Club,
  competition?: Competition
): string {
  // Priority: competition > team > club > default
  if (competition?.seasonStartMonth && competition.seasonStartMonth !== "inherit") {
    return competition.seasonStartMonth;
  }
  
  if (team?.seasonStartMonth && team.seasonStartMonth !== "inherit") {
    return team.seasonStartMonth;
  }
  
  if (club?.seasonStartMonth) {
    return club.seasonStartMonth;
  }
  
  return "January"; // fallback when null
}

// Convert month name to number (0-based)
export function monthNameToNumber(monthName: string): number {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months.indexOf(monthName);
}

// Generate season name based on start month and year
export function generateSeasonName(startMonth: string, startYear: number): string {
  const startMonthNum = monthNameToNumber(startMonth);
  
  if (startMonth === "January") {
    // Annual season: "2026"
    return startYear.toString();
  } else {
    // Cross-year season: "2025/26"
    const endYear = startYear + 1;
    return `${startYear}/${endYear.toString().slice(-2)}`;
  }
}

// Get current season based on today's date and season start month
export function getCurrentSeason(seasonStartMonth: string): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-based
  const startMonthNum = monthNameToNumber(seasonStartMonth);
  
  let seasonStartYear: number;
  
  if (currentMonth >= startMonthNum) {
    // We're in or past the start month, so current season started this year
    seasonStartYear = currentYear;
  } else {
    // We're before the start month, so current season started last year
    seasonStartYear = currentYear - 1;
  }
  
  return generateSeasonName(seasonStartMonth, seasonStartYear);
}

// Get all available seasons (current + past few years)
export function getAvailableSeasons(seasonStartMonth: string, yearsBack: number = 3): string[] {
  const seasons: string[] = [];
  const currentSeasonName = getCurrentSeason(seasonStartMonth);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const startMonthNum = monthNameToNumber(seasonStartMonth);
  
  let currentSeasonStartYear: number;
  if (currentMonth >= startMonthNum) {
    currentSeasonStartYear = currentYear;
  } else {
    currentSeasonStartYear = currentYear - 1;
  }
  
  // Generate seasons: 1 ahead + current + yearsBack previous
  for (let i = -1; i <= yearsBack; i++) {
    const seasonStartYear = currentSeasonStartYear - i;
    const seasonName = generateSeasonName(seasonStartMonth, seasonStartYear);
    seasons.push(seasonName);
  }
  
  return seasons;
}

// Check if a date falls within a specific season
export function isDateInSeason(date: Date, seasonName: string, seasonStartMonth: string): boolean {
  const startMonthNum = monthNameToNumber(seasonStartMonth);
  
  let seasonStartYear: number;
  if (seasonStartMonth === "January") {
    // Annual season: "2026" means Jan 2026 - Dec 2026
    seasonStartYear = parseInt(seasonName);
  } else {
    // Cross-year season: "2025/26" means Aug 2025 - Jul 2026
    seasonStartYear = parseInt(seasonName.split("/")[0]);
  }
  
  const seasonStart = new Date(seasonStartYear, startMonthNum, 1);
  let seasonEnd: Date;
  
  if (seasonStartMonth === "January") {
    // Annual season ends Dec 31 of same year
    seasonEnd = new Date(seasonStartYear, 11, 31, 23, 59, 59);
  } else {
    // Cross-year season ends one month before start month of next year
    const endMonthNum = startMonthNum - 1;
    const endYear = endMonthNum < 0 ? seasonStartYear + 2 : seasonStartYear + 1;
    const endMonth = endMonthNum < 0 ? 11 : endMonthNum;
    // Get last day of the end month
    seasonEnd = new Date(endYear, endMonth + 1, 0, 23, 59, 59);
  }
  
  return date >= seasonStart && date <= seasonEnd;
}

// Filter fixtures by season
export function filterFixturesBySeason<T extends { date: Date | string }>(
  fixtures: T[],
  seasonName: string,
  seasonStartMonth: string
): T[] {
  return fixtures.filter(fixture => {
    const fixtureDate = typeof fixture.date === 'string' ? new Date(fixture.date) : fixture.date;
    return isDateInSeason(fixtureDate, seasonName, seasonStartMonth);
  });
}