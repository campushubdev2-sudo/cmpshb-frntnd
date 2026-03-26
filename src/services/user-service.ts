// user-service.ts
import apiClient from "@/api/client";

class UserService {
  async getTotalUsers() {
    const response = await apiClient.get("/users/stats/overview");
    return response.data.data.totalUsers;
  }

  async getUsersByRole() {
    const response = await apiClient.get("/users/stats/overview");
    return response.data.data.usersByRole;
  }
}

export const userService = new UserService();
