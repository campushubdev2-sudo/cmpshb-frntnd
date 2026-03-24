import apiClient from "./client";
import { type User } from "../contexts/AuthContext";

export interface signInBody {
  identifier: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
  phoneNumber: string;
  email: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: User;
}

export const authApi = {
  signIn: (credentials: signInBody) => apiClient.post("/auth/sign-in", credentials),
  signUp: (data: SignupRequest) => apiClient.post("/auth/sign-up", data),
  verifyOtp: (_data: { email: string; otp: string }) => apiClient.post("/otp/verify"),
  sendOtp: (data: { email: string }) => apiClient.post("/otp/send", data),
  resendOtp: (data: { email: string }) => apiClient.post("/otp/resend", data),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    apiClient.post("/auth/reset-password", data),
  getProfile: () => apiClient.get("/auth/profile"),
  signOut: () => apiClient.post("/auth/logout"),
};
