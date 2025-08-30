export const CLUB_NAME = "Polk State College";

export const POSITION_COLORS = {
  GK: "bg-blue-100 text-blue-800",
  CB: "bg-red-100 text-red-800",
  LB: "bg-red-100 text-red-800",
  RB: "bg-red-100 text-red-800",
  CDM: "bg-green-100 text-green-800",
  CM: "bg-green-100 text-green-800",
  CAM: "bg-green-100 text-green-800",
  LM: "bg-green-100 text-green-800",
  RM: "bg-green-100 text-green-800",
  LW: "bg-slate-100 text-slate-700",
  RW: "bg-slate-100 text-slate-700",
  ST: "bg-slate-100 text-slate-700",
  CF: "bg-slate-100 text-slate-700",
};

export const STATUS_COLORS = {
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_CONTEST: "bg-gray-100 text-gray-800 border-gray-200",
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', tooltip: 'Dashboard Overview' },
  { id: 'fixtures', label: 'Fixtures', icon: 'Calendar', tooltip: 'Manage Fixtures' },
  { id: 'squad', label: 'Squad', icon: 'Users', tooltip: 'Squad Management' },
  { id: 'statistics', label: 'Statistics', icon: 'BarChart3', tooltip: 'Team Statistics' },
  { id: 'videos', label: 'Match Videos', icon: 'Video', tooltip: 'Match Videos' },
];
