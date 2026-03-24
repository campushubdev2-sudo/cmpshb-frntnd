import { useState } from "react";
import type { SignupRequest } from "../api/auth-api";
import { authService } from "../services/auth-service";

export const useUserRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (formData: SignupRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.registerNewUser(formData);
      return result;
    } catch (error: any) {
      setError(error.message || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error,
  };
};
