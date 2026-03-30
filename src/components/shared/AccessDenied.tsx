import { Link } from "react-router";
import { useAuthentication } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function AccessDenied() {
  const { authenticatedUser } = useAuthentication();
  const role = authenticatedUser?.role;

  const isAdviser = role === "adviser";
  const isOfficer = role === "officer";

  const redirectPath = isAdviser ? "/organizations" : isOfficer ? "/reports" : "/calendar";
  const redirectLabel = isAdviser ? "Go to Organizations" : isOfficer ? "Go to Reports" : "Go to Calendar";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* SVG Illustration */}
      <svg
        className="w-48 h-48 mb-8 text-muted-foreground/40"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="accessDeniedTitle"
      >
        <title id="accessDeniedTitle">Access Denied Illustration</title>
        
        {/* Background Circle */}
        <circle cx="100" cy="100" r="80" className="fill-muted" />
        
        {/* Lock Body */}
        <rect x="60" y="80" width="80" height="60" rx="8" className="fill-primary/20 stroke-primary" strokeWidth="3" />
        
        {/* Lock Shackle */}
        <path
          d="M70 80V65C70 51.1929 81.1929 40 95 40H105C118.807 40 130 51.1929 130 65V80"
          className="stroke-primary"
          strokeWidth="3"
          fill="none"
        />
        
        {/* Keyhole */}
        <circle cx="100" cy="110" r="6" className="fill-primary" />
        <path d="M100 116V128" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
        
        {/* X Mark */}
        <path
          d="M145 55L165 75M165 55L145 75"
          className="stroke-destructive"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Decorative Elements */}
        <circle cx="40" cy="50" r="4" className="fill-muted-foreground/30" />
        <circle cx="160" cy="150" r="6" className="fill-muted-foreground/30" />
        <circle cx="35" cy="140" r="5" className="fill-muted-foreground/20" />
        <circle cx="165" cy="45" r="4" className="fill-muted-foreground/20" />
      </svg>

      {/* Message */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        This content is not available for you
      </h1>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {isAdviser && "As an adviser, you have access to organizations and other relevant features."}
        {isOfficer && "As an officer, you have access to reports and other relevant features."}
        {!isAdviser && !isOfficer && "You don't have permission to view this page."}
      </p>

      {/* Redirect Button */}
      <Button asChild className="gap-2">
        <Link to={redirectPath}>
          {redirectLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
