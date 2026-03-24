import { authApi, type SignupRequest } from "../api/auth-api";

export const authService = {
  async registerNewUser(data: SignupRequest) {
    const response = await authApi.signUp(data);
    return response.data;
  },
};
