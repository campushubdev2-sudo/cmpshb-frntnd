import { Link } from "react-router";
import { FaGraduationCap } from "react-icons/fa6";
import { ArrowUpToLine, Bell, Building2, Calendar, GraduationCap, Users } from "lucide-react";

import Hero, { scrollTo } from "../../components/hero";
import { CalendarSection } from "../../components/ui/event-calendar";
import { useTheme } from "../../contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import SpotlightCard from "../../components/SpotlightCard";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import AnimatedGridPattern from "../../components/ui/animated-grid-pattern";
import CardNav from "../../components/CardNav";
import { useSchoolEvents } from "../../hooks/useSchoolEvents";
import { Skeleton } from "../../components/ui/skeleton";
import dayjs from "dayjs";

const PLATFORM_FEATURES_DATA = [
  {
    icon: Calendar,
    title: "Smart Event Coordination",
    description:
      "Bridge the gap between campus-wide and organization-specific events. Integrated calendars and automated notification systems keep everyone informed.",
  },
  {
    icon: Building2,
    title: "Organization Hub",
    description:
      "Digitize your organization’s bureaucracy. Submit bylaws and track approval status in real-time.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Never miss an update. Our system automatically triggers email and SMS alerts for critical actions.",
  },
  {
    icon: Users,
    title: "User Management",
    description: "Customized interfaces for Admins, Advisers, Officers, and Students.",
  },
];

const NAVIGATION_SCHEMA = [
  {
    label: "Explore",
    bgColor: "#111",
    textColor: "#fff",
    links: [
      { label: "Features", href: "#features" },
      { label: "Calendar", href: "#calendar" },
      { label: "About", href: "#cta" },
    ],
  },
  {
    label: "Account",
    bgColor: "#f5f5f5",
    textColor: "#000",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Register", href: "/register" },
    ],
  },
  {
    label: "Quick Links",
    bgColor: "#222",
    textColor: "#fff",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
];

const CalendarModule = () => {
  const { schoolEvents, loading } = useSchoolEvents();

  return (
    <section className="grid grid-cols-1 gap-4 p-4" id="calendar">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Campus Calendar</h2>
        <p className="text-muted-foreground">Stay on top of upcoming events and activities.</p>
      </div>
      <div className="flex h-auto max-h-150 flex-col gap-5 md:flex-row">
        <CalendarSection events={schoolEvents} isAdmin={false} />
        <Card size="sm" className="w-full md:w-1/4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-wider uppercase">
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col overflow-y-scroll py-8">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <div className="flex flex-1 items-center gap-2">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : schoolEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center">
                <Calendar className="mb-2 size-10 opacity-60" />
                <p className="text-sm">No events this month</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {schoolEvents.map((event, index) => {
                  return (
                    <div
                      key={index}
                      className="hover:bg-accent hover:text-accent-foreground -mx-2 flex cursor-pointer items-center gap-4 rounded-lg p-2 transition-colors duration-200"
                    >
                      {/* Left: Date box */}
                      <div className="bg-card flex aspect-square w-14 flex-col items-center justify-center rounded-md border text-center">
                        <span className="text-xs font-medium uppercase">
                          {dayjs(event.start).format("MMM").toUpperCase()}
                        </span>
                        <span className="text-lg font-semibold">
                          {dayjs(event.end).format("DD")}
                        </span>
                      </div>

                      {/* Right: Event info */}
                      <div className="flex flex-1 items-center gap-2">
                        {/* Dot indicator */}
                        <span className="bg-primary h-2 w-2 rounded-full" />

                        {/* Event title */}
                        <p className="text-sm font-medium">{event.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const FeaturesModule = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <section
    id="features"
    className={cn(
      "border-t py-20 transition-colors duration-300",
      isDarkMode ? "border-neutral-800 bg-neutral-900/50" : "border-border",
    )}
  >
    <div className="mx-auto mb-12 max-w-7xl px-6 text-center">
      <h2 className={cn("text-3xl font-bold", isDarkMode ? "text-neutral-50" : "text-foreground")}>
        Everything you need to manage your campus
      </h2>
      <p className={cn("mt-4 text-lg", isDarkMode ? "text-neutral-400" : "text-muted-foreground")}>
        Powerful features designed to simplify campus administration.
      </p>
    </div>

    <div className="grid gap-6 p-3 sm:grid-cols-2 lg:grid-cols-4">
      {PLATFORM_FEATURES_DATA.map((feature, index) => (
        <SpotlightCard
          key={index}
          className="h-full rounded-xl border p-6"
          theme={isDarkMode ? "dark" : "light"}
          spotlightColor="rgba(0, 255, 127, 0.15)"
        >
          <div className="relative z-10">
            <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
              <feature.icon className="text-primary h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground text-sm">{feature.description}</p>
          </div>
        </SpotlightCard>
      ))}
    </div>
  </section>
);

const FooterModule = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <footer
    className={cn(
      "relative overflow-hidden border-t transition-colors duration-300",
      isDarkMode ? "border-neutral-800" : "border-border",
    )}
  >
    <div className="pointer-events-none absolute inset-0">
      <AnimatedGridPattern
        className="inset-x-0 h-full mask-[radial-gradient(500px_circle_at_center,white,transparent)]"
        duration={3}
        maxOpacity={0.1}
        numSquares={30}
      />
    </div>

    <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <GraduationCap className="text-primary h-6 w-6" />
          <span
            className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-neutral-50" : "text-foreground",
            )}
          >
            CampusHub
          </span>
        </div>

        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium",
            isDarkMode ? "text-neutral-400" : "text-muted-foreground",
          )}
        >
          <Link to="/login" className="hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="hover:text-primary transition-colors">
            Register
          </Link>
        </nav>

        <div className="text-center md:text-right">
          <p
            className={cn(
              "text-xs tracking-wide",
              isDarkMode ? "text-neutral-600" : "text-neutral-400",
            )}
          >
            © {new Date().getFullYear()} CampusHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

const LandingPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <>
      <title>CampusHub | Homepage</title>
      <div className={cn("absolute min-h-screen space-y-5", isDarkMode && "dark")}>
        <CardNav
          logo={FaGraduationCap}
          items={NAVIGATION_SCHEMA}
          baseColor={isDarkMode ? "black" : "white"}
          menuColor={isDarkMode ? "white" : "black"}
          buttonBgColor={isDarkMode ? "white" : "black"}
          buttonTextColor={isDarkMode ? "black" : "white"}
        />

        <section className="border p-2.5 pt-20">
          <Hero />
        </section>

        <CalendarModule />
        <FeaturesModule isDarkMode={isDarkMode} />

        {/* CALL TO ACTION */}
        <section
          id="cta"
          className={cn("border-t py-20", isDarkMode ? "bg-neutral-900/50" : "bg-muted/30")}
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2
              className={cn(
                "text-3xl font-bold",
                isDarkMode ? "text-neutral-50" : "text-foreground",
              )}
            >
              Ready to get started?
            </h2>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/register">Create an account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <FooterModule isDarkMode={isDarkMode} />

        {/* Floating Scroll Top */}
        <Button
          variant="ghost"
          onClick={() => scrollTo("#")}
          className={cn(
            "fixed right-8 bottom-8 z-50 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-110",
            isDarkMode
              ? "border-neutral-800 bg-neutral-900/80 text-neutral-400"
              : "border-gray-200 bg-white/80 text-gray-600",
          )}
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
};

export default LandingPage;
