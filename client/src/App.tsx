import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import TestComponent from "./test-component";
import Dashboard from "@/pages/dashboard";
import Fixtures from "@/pages/fixtures";
import Squad from "@/pages/squad";
import Statistics from "@/pages/statistics";
import Videos from "@/pages/videos";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/test" component={TestComponent} />
      <Route path="/" component={TestComponent} />
      <Route path="/fixtures" component={Fixtures} />
      <Route path="/squad" component={Squad} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/videos" component={Videos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
