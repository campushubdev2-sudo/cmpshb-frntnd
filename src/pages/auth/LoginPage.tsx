import { Eye, EyeOff, GraduationCap, ArrowLeft, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { useState, type FormEvent } from "react";
import { useAuthentication } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { AxiosError } from "axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthentication();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);

      if (!formData.identifier || !formData.password) {
        toast.error("All fields are required");
        return;
      }

      const result = await login(formData);
      toast.success(result.message || "Login Success");
      navigate("/dashboard");
    } catch (error) {
      const err = error as AxiosError<any>;
      setError(true);
      toast.error(err.response?.data?.message || "Invalid username/password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <title>CampusHub | Sign in</title>
      <main className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="border-border w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center rounded-xl p-3">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                <GraduationCap className="h-7 w-7" />
              </div>
            </div>

            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              Welcome back
            </CardTitle>

            <CardDescription className="text-muted-foreground text-sm">
              Sign in to your CampusHub account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Identifier Field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className={cn(error && "text-destructive")}>
                  Email or Username
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email or username"
                  required
                  value={formData.identifier}
                  onChange={(e) => {
                    setError(false);
                    setFormData({ ...formData, identifier: e.target.value });
                  }}
                  className={cn(
                    "h-11",
                    error && "border-destructive focus-visible:ring-destructive",
                  )}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={cn(error && "text-destructive")}>
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setError(false);
                      setFormData({ ...formData, password: e.target.value });
                    }}
                    className={cn(
                      "h-11 pr-10",
                      error && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-11 w-full text-base font-semibold"
                disabled={loading || !(formData.identifier && formData.password)}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Button
                variant="ghost"
                className={`text-muted-foreground hover:text-primary flex items-center gap-2 text-sm ${loading && "hidden"}`}
                onClick={() => navigate("/")}
              >
                <span
                  className={cn("flex flex-row items-center gap-2", loading ? "invisible" : "")}
                >
                  <ArrowLeft size={16} /> Home
                </span>
              </Button>

              <div className={`bg-border h-4 w-px ${loading && "hidden"}`} />

              <Button
                variant="ghost"
                className={`text-muted-foreground hover:text-primary flex items-center gap-2 text-sm ${loading && "hidden"}`}
                onClick={() => navigate("/register")}
              >
                <span
                  className={cn("flex flex-row items-center gap-2", loading ? "invisible" : "")}
                >
                  <LogIn size={16} /> Need an account?
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default LoginPage;
