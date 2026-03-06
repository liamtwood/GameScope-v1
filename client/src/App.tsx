import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TeamProvider } from "@/contexts/team-context";
import { ClubProvider } from "@/contexts/club-context";
import { TabProvider } from "@/contexts/tab-context";
import { ThemeInitializer } from "@/components/ThemeInitializer";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import MobileHome from "@/pages/mobile/MobileHome";
import MobileTeam from "@/pages/mobile/MobileTeam";
import MobileMatch from "@/pages/mobile/MobileMatch";
import MobileProfile from "@/pages/mobile/MobileProfile";
import MobileNotifications from "@/pages/mobile/MobileNotifications";
import Dashboard from "@/pages/dashboard";
import ClubManagement from "@/pages/club-management";
import Fixtures from "@/pages/fixtures";
import FixtureDetails from "@/pages/fixture-details";
import Analysis from "@/pages/analysis";
import Squad from "@/pages/squad";
import Statistics from "@/pages/statistics";
import Teams from "@/pages/teams";
import Videos from "@/pages/videos";
import Clubs from "@/pages/clubs";
import Settings from "@/pages/settings";
import PlayerDetails from "@/pages/player-details";
import PlayerProfiles from "@/pages/player-profiles";
import Users from "@/pages/users";
import DevOpsUsers from "@/pages/devops-users";
import UserDetails from "@/pages/user-details";
import MatchAnalysis from "@/pages/match-analysis";
import WatchMatchVideo from "@/pages/watch-match-video";
import Requirements from "@/pages/requirements";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/teams" component={Teams} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/club-management" component={ClubManagement} />
      <Route path="/fixtures" component={Fixtures} />
      <Route path="/fixtures/:id" component={FixtureDetails} />
      <Route path="/analysis/:fixtureId" component={Analysis} />
      <Route path="/squad" component={Squad} />
      <Route path="/players/:id" component={PlayerDetails} />
      <Route path="/player-profiles" component={PlayerProfiles} />
      <Route path="/users" component={Users} />
      <Route path="/devops-users" component={DevOpsUsers} />
      <Route path="/users/:id" component={UserDetails} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/teams" component={Teams} />
      <Route path="/videos" component={Videos} />
      <Route path="/watch-match-video" component={WatchMatchVideo} />
      <Route path="/match-analysis" component={MatchAnalysis} />
      <Route path="/clubs" component={Clubs} />
      <Route path="/settings" component={Settings} />
      <Route path="/requirements" component={Requirements} />
      <Route path="/m" component={MobileHome} />
      <Route path="/m/team/:teamId" component={MobileTeam} />
      <Route path="/m/match/:fixtureId" component={MobileMatch} />
      <Route path="/m/profile" component={MobileProfile} />
      <Route path="/m/notifications" component={MobileNotifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="gamescope-theme">
      <QueryClientProvider client={queryClient}>
        <ClubProvider>
          <TeamProvider>
            <TabProvider>
              <TooltipProvider>
                <ThemeInitializer />
                <div className="min-h-screen bg-background text-foreground">
                  <Toaster />
                  <Router />
                </div>
              </TooltipProvider>
            </TabProvider>
          </TeamProvider>
        </ClubProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
