import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import Dashboard from "@/pages/dashboard";
import ClubManagement from "@/pages/club-management";
import Fixtures from "@/pages/fixtures";
import FixtureDetails from "@/pages/fixture-details";
import Analysis from "@/pages/analysis";
import Squad from "@/pages/squad";
import Statistics from "@/pages/statistics";
import Teams from "@/pages/teams";
import Videos from "@/pages/videos";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/club-management" component={ClubManagement} />
      <Route path="/fixtures" component={Fixtures} />
      <Route path="/fixtures/:id" component={FixtureDetails} />
      <Route path="/analysis/:fixtureId" component={Analysis} />
      <Route path="/squad" component={Squad} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/teams" component={Teams} />
      <Route path="/videos" component={Videos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="gamescope-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
