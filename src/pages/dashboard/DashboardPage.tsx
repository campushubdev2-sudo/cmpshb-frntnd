import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from "react";
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const stats = {
  users: 100,
  events: 22,
  upcomingEvents: 12,
};

const quickActions = [
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
];

function formatAction(action: string) {
  if (!action) return "Unknown action";
  return action.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type RecentEvent = {
  date: Date;
  _id: string;
  title: string;
  venue: string;
};

type RecentLog = {
  _id: string;
  action: string;
  userId: {
    username: string;
  };
  createdAt: Date;
};

type UsersByRole = {
  [role: string]: number;
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [usersByRole, setUsersByRole] = useState<UsersByRole>({});
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  const { authenticatedUser } = useAuthentication();

  useEffect(() => {
    setRecentEvents([
      { date: new Date("2026-03-30"), _id: "id1", title: "Event 1", venue: "Venue A" },
      { date: new Date("2026-02-05"), _id: "id2", title: "Event 2", venue: "Venue B" },
      { date: new Date("2026-02-10"), _id: "id3", title: "Event 3", venue: "Venue C" },
      { date: new Date("2026-02-15"), _id: "id4", title: "Event 4", venue: "Venue D" },
      { date: new Date("2026-02-20"), _id: "id5", title: "Event 5", venue: "Venue E" },

      { date: new Date("2026-02-22"), _id: "id6", title: "Event 6", venue: "Venue F" },
      { date: new Date("2026-02-25"), _id: "id7", title: "Event 7", venue: "Venue G" },
      { date: new Date("2026-02-28"), _id: "id8", title: "Event 8", venue: "Venue H" },
      { date: new Date("2026-03-02"), _id: "id9", title: "Event 9", venue: "Venue I" },
      { date: new Date("2026-03-05"), _id: "id10", title: "Event 10", venue: "Venue J" },
      { date: new Date("2026-03-08"), _id: "id11", title: "Event 11", venue: "Venue K" },
    ]);
  }, []);

  useEffect(() => {
    setRecentLogs([
      {
        _id: "log1",
        action: "Created event",
        userId: { username: "admin1" },
        createdAt: new Date("2026-03-01T10:00:00"),
      },
      {
        _id: "log2",
        action: "Updated user",
        userId: { username: "admin2" },
        createdAt: new Date("2026-03-02T11:30:00"),
      },
      {
        _id: "log3",
        action: "Deleted event",
        userId: { username: "admin3" },
        createdAt: new Date("2026-03-03T09:15:00"),
      },
      {
        _id: "log4",
        action: "Logged in",
        userId: { username: "admin1" },
        createdAt: new Date("2026-03-04T08:45:00"),
      },
      {
        _id: "log5",
        action: "Sent notification",
        userId: { username: "admin2" },
        createdAt: new Date("2026-03-05T14:20:00"),
      },
    ]);
  }, []);

  useEffect(() => {
    setUsersByRole({
      admin: 5,
      student: 70,
      officer: 15,
      guest: 10,
    });
  }, []);

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {authenticatedUser?.username || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} &middot; Here&apos;s your campus overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Total Users"
            value={stats.users}
            icon={Users}
            description="Registered users"
            href="/users"
            sparklineData={(() => {
              const base = stats.users || 10;
              return Array.from({ length: 12 }, (_, i) =>
                Math.round(base * (0.4 + (i / 11) * 0.6) + Math.random() * base * 0.08),
              );
            })()}
            sparklineColor="#10b981"
          />
          <StatCard
            title="Events"
            value={stats.events}
            icon={CalendarDays}
            description={`${stats.upcomingEvents} upcoming`}
            href="/events"
            sparklineData={(() => {
              const base = stats.events || 5;
              return Array.from({ length: 12 }, (_, i) =>
                Math.round(base * (0.3 + (i / 11) * 0.7) + Math.random() * base * 0.1),
              );
            })()}
            sparklineColor="#3b82f6"
          />
        </div>

        {/* Quick Actions */}
        {authenticatedUser?.role === "admin" && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
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
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events - 2 columns */}
          <div className="lg:col-span-2">
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
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link to="/events">Create your first event</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  <div className="divide-y divide-border">
                    {recentEvents.map((event) => {
                      const eventDate = event.date ? new Date(event.date) : null;
                      const isPast = eventDate && eventDate < new Date();
                      return (
                        <div
                          key={event._id}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              {event.venue && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {event.venue}
                                </span>
                              )}
                              {eventDate && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(eventDate, "MMM dd, yyyy")}
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                {authenticatedUser?.role === "admin" && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/logs" className="text-muted-foreground">
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
              <Card>
                <CardContent className="py-4">
                  {recentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentLogs.map((log) => (
                        <div key={log._id} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {formatAction(log.action)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {log.userId?.username || "System"}
                              </span>
                              {log.createdAt && (
                                <>
                                  <span className="text-xs text-muted-foreground">&middot;</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(log.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* User Distribution */}
            {Object.entries(usersByRole as UsersByRole).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Users by Role</h2>
                <Card>
                  <CardContent className="py-4 space-y-3">
                    {Object.entries(usersByRole).map(([role, count]) => {
                      const percentage = Math.round((count / stats.users) * 100);
                      return (
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
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
