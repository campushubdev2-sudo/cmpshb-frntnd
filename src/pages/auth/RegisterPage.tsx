import React, { useState } from "react";
import { useNavigate } from "react-router";
import { UserPlus, Eye, EyeOff, Home, LogIn } from "lucide-react";
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
import { useUserRegistration } from "../../hooks/useUserRegistration";
import { toast } from "sonner";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useUserRegistration();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    email: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const { confirmPassword, ...formDataWithoutConfirmPassword } = formData;
    try {
      const result = await register(formDataWithoutConfirmPassword);
      toast.success(result.message || "Sign up success");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Sign up error. Try again later");
    } finally {
      setFormData({
        confirmPassword: "",
        email: "",
        password: "",
        phoneNumber: "",
        username: "",
      });
    }
  };

  return (
    <>
      <title>CampusHub | Sign up</title>
      <main className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="border-border w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center rounded-xl p-3">
              <UserPlus className="bg-primary/10 text-primary h-12 w-12 rounded-full p-2.5" />
            </div>

            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              Create Account
            </CardTitle>

            <CardDescription className="text-muted-foreground text-sm">
              Enter your details to register for CampusHub
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="johndoe@gmail.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+639XXXXXXXXX"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="**********"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={"password"}
                    placeholder="**********"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-11 pr-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Register"}
              </Button>
            </form>

            {/* Adjusted Layout for Navigation */}
            <div className="mt-8 border-t pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary order-2 flex items-center gap-2 text-sm sm:order-1"
                  onClick={() => navigate("/")}
                >
                  <span className="flex items-center gap-2">
                    <Home size={16} />
                    Home
                  </span>
                </Button>

                <div className="bg-border hidden h-4 w-px sm:order-2 sm:block" />

                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary order-1 flex items-center gap-2 text-sm sm:order-3"
                  onClick={() => navigate("/login")}
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={16} />
                    Already have an account?
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default RegisterPage;
