import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TeamProvider } from "@/contexts/team-context";
import { ClubProvider } from "@/contexts/club-context";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { ResponsiveWrapper } from "@/components/responsive-wrapper";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { MainLayout } from "@/components/layout/main-layout";
import { useMobile } from "@/hooks/use-mobile";

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
import PlayerDetails from "@/pages/player-details";
import PlayerProfiles from "@/pages/player-profiles";
import Users from "@/pages/users";
import DevOpsUsers from "@/pages/devops-users";
import UserDetails from "@/pages/user-details";
import MatchAnalysis from "@/pages/match-analysis";
import NotFound from "@/pages/not-found";

// Mobile components
import DashboardMobile from "@/pages/mobile/dashboard-mobile";
import FixturesMobile from "@/pages/mobile/fixtures-mobile";

function Router() {
  const { isMobile } = useMobile();

  const LayoutWrapper = ({ children, title = "GameScope", subtitle = "AI Video Analysis", mobileComponent }: { 
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    mobileComponent?: React.ReactNode;
  }) => {
    // Force desktop layout for now to debug the issue
    return <MainLayout title={title} subtitle={subtitle}>{children}</MainLayout>;
  };

  return (
    <Switch>
      <Route path="/" component={() => <LayoutWrapper><Home /></LayoutWrapper>} />
      <Route path="/home" component={() => <LayoutWrapper><Home /></LayoutWrapper>} />
      <Route path="/teams" component={() => <LayoutWrapper><Teams /></LayoutWrapper>} />
      <Route path="/dashboard" component={() => <LayoutWrapper mobileComponent={<DashboardMobile />}><Dashboard /></LayoutWrapper>} />
      <Route path="/club-management" component={() => <LayoutWrapper><ClubManagement /></LayoutWrapper>} />
      <Route path="/fixtures" component={() => <LayoutWrapper mobileComponent={<FixturesMobile />}><Fixtures /></LayoutWrapper>} />
      <Route path="/fixtures/:id" component={() => <LayoutWrapper><FixtureDetails /></LayoutWrapper>} />
      <Route path="/analysis/:fixtureId" component={() => <LayoutWrapper><Analysis /></LayoutWrapper>} />
      <Route path="/squad" component={() => <LayoutWrapper><Squad /></LayoutWrapper>} />
      <Route path="/players/:id" component={() => <LayoutWrapper><PlayerDetails /></LayoutWrapper>} />
      <Route path="/player-profiles" component={() => <LayoutWrapper><PlayerProfiles /></LayoutWrapper>} />
      <Route path="/users" component={() => <LayoutWrapper><Users /></LayoutWrapper>} />
      <Route path="/devops-users" component={() => <LayoutWrapper><DevOpsUsers /></LayoutWrapper>} />
      <Route path="/users/:id" component={() => <LayoutWrapper><UserDetails /></LayoutWrapper>} />
      <Route path="/statistics" component={() => <LayoutWrapper><Statistics /></LayoutWrapper>} />
      <Route path="/videos" component={() => <LayoutWrapper><Videos /></LayoutWrapper>} />
      <Route path="/match-analysis" component={() => <LayoutWrapper><MatchAnalysis /></LayoutWrapper>} />
      <Route path="/clubs" component={() => <LayoutWrapper><Clubs /></LayoutWrapper>} />
      <Route path="/settings" component={() => <LayoutWrapper><Settings /></LayoutWrapper>} />
      <Route component={() => <LayoutWrapper><NotFound /></LayoutWrapper>} />
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
              <ThemeInitializer />
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
