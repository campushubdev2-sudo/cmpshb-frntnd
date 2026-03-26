// event-service.ts
import apiClient from "@/api/client";

class EventService {
  async getUpcomingEvents() {
    try {
      const response = await apiClient.get("/school-events/stats");

      const upcomingEvents = response?.data?.data?.upcomingEvents ?? 0;

      return upcomingEvents;
    } catch (error) {
      console.error("Failed to fetch upcoming events:", error);
      return 0;
    }
  }

  async getTotalEvents() {
    try {
      const response = await apiClient.get("/school-events/stats");

      const upcomingEvents = response?.data?.data?.totalEvents ?? 0;

      return upcomingEvents;
    } catch (error) {
      console.error("Failed to fetch total events:", error);
      return 0;
    }
  }

  async getEvents() {
    try {
      const response = await apiClient.get("/school-events");

      const events = Array.isArray(response?.data?.data) ? response.data.data : [];
      return events;
    } catch (error) {
      console.error("Failed to fetch total events:", error);
      return [];
    }
  }
}

export const eventService = new EventService();
