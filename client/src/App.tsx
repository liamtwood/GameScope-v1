import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TeamProvider } from "@/contexts/team-context";
import { ClubProvider } from "@/contexts/club-context";

import Home from "@/pages/home";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/teams" component={Teams} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/club-management" component={ClubManagement} />
      <Route path="/fixtures" component={Fixtures} />
      <Route path="/fixtures/:id" component={FixtureDetails} />
      <Route path="/analysis/:fixtureId" component={Analysis} />
      <Route path="/squad" component={Squad} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/teams" component={Teams} />
      <Route path="/videos" component={Videos} />
      <Route path="/clubs" component={Clubs} />
      <Route path="/settings" component={Settings} />
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
            <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Toaster />
              <Router />
            </div>
            </TooltipProvider>
          </TeamProvider>
        </ClubProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
