import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
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
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LocalLogin} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/courses">
            <ProtectedRoute route="/courses">
              <Courses />
            </ProtectedRoute>
          </Route>
          <Route path="/assignments">
            <ProtectedRoute route="/assignments">
              <Assignments />
            </ProtectedRoute>
          </Route>
          <Route path="/grades">
            <ProtectedRoute route="/grades">
              <Grades />
            </ProtectedRoute>
          </Route>
          <Route path="/analytics">
            <ProtectedRoute route="/analytics">
              <Analytics />
            </ProtectedRoute>
          </Route>
          <Route path="/announcements">
            <ProtectedRoute route="/announcements">
              <Announcements />
            </ProtectedRoute>
          </Route>
          <Route path="/messages">
            <ProtectedRoute route="/messages">
              <Messages />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute route="/profile">
              <Profile />
            </ProtectedRoute>
          </Route>
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
