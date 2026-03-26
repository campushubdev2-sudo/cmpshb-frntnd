// logs-service.ts
import apiClient from "@/api/client";

class LogsService {
  async getLogs() {
    const response = await apiClient.get("/audit-logs");
    return response.data.data;
  }
}

export const logsService = new LogsService();
