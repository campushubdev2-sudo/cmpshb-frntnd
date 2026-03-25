import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { BrowserRouter as Router } from "react-router";
import { AuthenticationProvider, AUTHENTICATION_STORAGE_KEY } from "./contexts/AuthContext.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

const AUTH_TOKEN_KEY = "auth-token";

function setupAuthListener() {
  const handler = (event: Event) => {
    console.log("Session expired → redirecting");
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      console.log("[Auth Error]", customEvent.detail);
    }
    localStorage.removeItem(AUTHENTICATION_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.href = "/login";
  };

  window.addEventListener("auth:token-expired", handler);
  return () => window.removeEventListener("auth:token-expired", handler);
}

setupAuthListener();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthenticationProvider>
        <Router>
          <App />
          <Toaster richColors={true} position="top-center" duration={3000} />
        </Router>
      </AuthenticationProvider>
    </ThemeProvider>
  </StrictMode>,
);
