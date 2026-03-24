import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { BrowserRouter as Router } from "react-router";
import { AuthenticationProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

function setupAuthListener() {
  const handler = () => {
    console.log("Session expired → redirecting");
    localStorage.removeItem("user");
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
