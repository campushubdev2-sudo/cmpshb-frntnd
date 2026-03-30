import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  KeyRound,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { toast } from "sonner";
import { authApi } from "@/api/auth-api";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // const handleNext = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Logic for API calls would go here based on the current step
  //   if (step < 3) setStep(step + 1);
  //   else {
  //     // Final Submit Logic
  //     navigate("/login");
  //   }
  // };
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.email) {
        toast.error("Email is required");
        return;
      }

      const response = await authApi.sendOtp({ email: formData.email });
      console.log(response);
    } else {
      // Final Submit Logic
      navigate("/login");
    }
  };

  return (
    <>
      <title>CampusHub | Reset Password</title>
      <main className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="border-border w-full max-w-md shadow-lg transition-all duration-300">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center rounded-xl p-3">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                {step === 1 && <Mail className="h-6 w-6" />}
                {step === 2 && <ShieldCheck className="h-6 w-6" />}
                {step === 3 && <KeyRound className="h-6 w-6" />}
              </div>
            </div>

            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "New Password"}
            </CardTitle>

            <CardDescription className="text-muted-foreground text-sm">
              {step === 1 && "Enter your email to receive a reset code"}
              {step === 2 && `Code sent to ${formData.email}`}
              {step === 3 && "Create a strong new password for your account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleNext} className="space-y-4">
              {/* STEP 1: EMAIL */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                </div>
              )}

              {/* STEP 2: OTP */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                    className="h-11 text-center font-mono text-lg tracking-[0.5em]"
                  />
                  <p className="text-muted-foreground pt-2 text-center text-xs">
                    Didn't get a code?{" "}
                    <button type="button" className="text-primary font-medium hover:underline">
                      Resend
                    </button>
                  </p>
                </div>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              <button
                className="group/button flex flex-row items-center justify-center gap-2 w-full h-11 px-6 rounded-4xl bg-primary text-primary-foreground text-base font-semibold transition-all active:translate-y-px disabled:opacity-50 cursor-pointer outline-none select-none"
                onClick={handleNext}
              >
                <span>{step === 3 ? "Reset Password" : "Continue"}</span>
                {step < 3 && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Navigation Footer - Locked Consistency */}
            <div className="mt-8 border-t pt-6">
              <div className="flex flex-row items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <div className="flex items-center gap-2">
                  <button
                    className="group/button flex flex-row items-center justify-center gap-2 h-9 px-3 rounded-4xl border border-transparent bg-clip-padding text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-all active:translate-y-px outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft size={16} />

                    <span>Home</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="group/button flex flex-row items-center justify-center gap-2 h-9 px-3 rounded-4xl border border-transparent bg-clip-padding text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-all active:translate-y-px outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    onClick={() => navigate("/login")}
                  >
                    <LogIn size={16} />

                    <span>Back to Login</span>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default ForgotPasswordPage;
