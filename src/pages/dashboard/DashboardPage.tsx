import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useEffect, useState, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuthentication } from "@/contexts/AuthContext";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Clock,
  MapPin,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/user-service";
import { eventService } from "@/services/event-service";
import { logsService } from "@/services/logs-service";

// G25: Semantic Constants
const DATE_FORMAT_FULL = "EEEE, MMMM d, yyyy";
const DATE_FORMAT_SHORT = "MMM dd, yyyy";
const BASE_SPARKLINE_POINTS = 12;

const QUICK_ACTIONS = [
  { label: "Add User", icon: Users, path: "/users", color: "text-blue-600 bg-blue-50" },
  {
    label: "New Event",
    icon: CalendarDays,
    path: "/events",
    color: "text-emerald-600 bg-emerald-50",
  },
  { label: "Add Officer", icon: UserCog, path: "/officers", color: "text-violet-600 bg-violet-50" },
  {
    label: "Send Notification",
    icon: Bell,
    path: "/notifications",
    color: "text-amber-600 bg-amber-50",
  },
] as const;

// F1: Single Responsibility / G23: Encapsulate logic
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatAction(action: string): string {
  if (!action) return "Unknown action";
  return action.replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

// Data Structure Definitions
type RecentEvent = {
  _id: string;
  title: string;
  venue: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
};

// Updated to match specified log schema
type RecentLog = {
  _id: string;
  action: string;
  userId: {
    _id: string;
    username: string;
    role: string;
    email: string;
  };
  createdAt: string; // ISO string from API
  updatedAt: string;
};

type UsersByRole = Record<string, number>;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [usersByRole, setUsersByRole] = useState<UsersByRole>({});
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  const { authenticatedUser } = useAuthentication();

  // Role Checks
  const isAdmin = authenticatedUser?.role === "admin";
  const isOfficer = authenticatedUser?.role === "officer";
  const isAdviser = authenticatedUser?.role === "adviser";

  // Logical groupings for permissions
  const canViewEventStats = isAdmin || isOfficer || isAdviser;

  // F2: Logic encapsulation - unified data fetch
  const initializeDashboardData = useCallback(async () => {
    try {
      // Conditionally fetch data based on role permissions
      const [userCount, upcoming, total, events, roleStats, logs] = await Promise.all([
        isAdmin ? userService.getTotalUsers() : Promise.resolve(0),
        eventService.getUpcomingEvents(),
        eventService.getTotalEvents(),
        eventService.getEvents(),
        isAdmin ? userService.getUsersByRole() : Promise.resolve({}),
        isAdmin ? logsService.getLogs() : Promise.resolve([]),
      ]);

      setTotalUsers(userCount);
      setUpcomingEvents(upcoming);
      setTotalEvents(total);
      setRecentEvents(events || []);
      setUsersByRole(roleStats);
      setRecentLogs(logs || []);
    } catch (error) {
      console.error("Dashboard failed to initialize:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    initializeDashboardData();
  }, [initializeDashboardData]);

  // G10: Vertical Separation (Variables close to usage)
  const generateSparkline = (baseValue: number, color: string) => ({
    data: Array.from({ length: BASE_SPARKLINE_POINTS }, (_, i) =>
      Math.round(
        (baseValue || 10) * (0.4 + (i / 11) * 0.6) + Math.random() * (baseValue || 10) * 0.08,
      ),
    ),
    color,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <title>CampusHub | Dashboard</title>

      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {authenticatedUser?.username || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), DATE_FORMAT_FULL)} &middot; Here&apos;s your campus overview
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total User Stat: Restricted to Admin only */}
          {isAdmin && (
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={Users}
              description="Registered users"
              href="/users"
              sparklineData={generateSparkline(totalUsers, "#10b981").data}
              sparklineColor="#10b981"
            />
          )}

          {/* Total Event Stat: Visible to Admin, Officers, and Advisers */}
          {canViewEventStats && (
            <StatCard
              title="Events"
              value={totalEvents}
              icon={CalendarDays}
              description={`${upcomingEvents} upcoming`}
              href="/events"
              sparklineData={generateSparkline(totalEvents, "#3b82f6").data}
              sparklineColor="#3b82f6"
            />
          )}
        </section>

        {isAdmin && (
          <nav aria-label="Quick Actions">
            <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className={`rounded-lg p-2.5 ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </nav>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/events" className="text-muted-foreground">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            {recentEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No events yet</p>
                  {/* Create Event Button: Restricted to Admin only */}
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/events">Create your first event</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  <div className="divide-y divide-border">
                    {recentEvents.map((event) => {
                      const startDate = event.startDate ? new Date(event.startDate) : null;
                      const isPast = startDate && startDate < new Date();

                      return (
                        <div
                          key={event._id}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              {event.venue && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {event.venue}
                                </span>
                              )}
                              {startDate && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(startDate, DATE_FORMAT_SHORT)}
                                  {!event.allDay && event.startTime && ` • ${event.startTime}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant={isPast ? "secondary" : "default"}>
                            {isPast ? "Past" : "Upcoming"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>

          {isAdmin && (
            <aside className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Activity & Stats</h2>
              <Card>
                <CardContent className="py-4">
                  {recentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar h-80">
                      {recentLogs.map((log) => (
                        <div key={log._id} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {formatAction(log.action)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground font-medium">
                                {log.userId?.username || "System"}
                              </span>
                              <span className="text-xs text-muted-foreground">&middot;</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {Object.keys(usersByRole).length > 0 && (
                <Card>
                  <CardContent className="py-4 space-y-3">
                    {Object.entries(usersByRole).map(([role, count]) => (
                      <div key={role}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize text-foreground">
                            {role}
                          </span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.round((count / (totalUsers || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </aside>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
