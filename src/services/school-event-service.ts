import apiClient from "../api/client";
import type { CalendarEvent } from "@ilamy/calendar";

export interface CampusEventDTO {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  objective?: string;
  backgroundColor?: string;
  allDay: boolean;
}

export interface CampusEvent extends CalendarEvent {
  description?: string;
}

class EventService {
  async getEvents() {
    const response = await apiClient.get("/school-events");
    return response.data;
  }
}

export const eventService = new EventService();
