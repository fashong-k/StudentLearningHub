import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import LocalLogin from "@/pages/LocalLogin";
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import Assignments from "@/pages/Assignments";
import Grades from "@/pages/Grades";
import Profile from "@/pages/Profile";
import Analytics from "@/pages/Analytics";
import Announcements from "@/pages/Announcements";
import Messages from "@/pages/Messages";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Check if we're in local development mode (no DATABASE_URL)
  const isLocalDevelopment = import.meta.env.VITE_LOCAL_DEV === 'true' || !import.meta.env.VITE_DATABASE_URL;

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={isLocalDevelopment ? LocalLogin : Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/courses" component={Courses} />
          <Route path="/assignments" component={Assignments} />
          <Route path="/grades" component={Grades} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/announcements" component={Announcements} />
          <Route path="/messages" component={Messages} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
