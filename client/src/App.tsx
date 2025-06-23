import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { NotificationToast } from "@/components/notifications/notification-toast";
import Dashboard from "@/pages/dashboard";
import Rooms from "@/pages/rooms";
import Calendar from "@/pages/calendar";
import Bookings from "@/pages/bookings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/rooms" component={Rooms} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/bookings" component={Bookings} />
        <Route component={NotFound} />
      </Switch>
      <NotificationToast />
    </div>
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
