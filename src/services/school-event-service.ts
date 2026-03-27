import apiClient from "../api/client";
import type { CalendarEvent } from "@ilamy/calendar";
import { eventsAPI, type SchoolEvent, type SchoolEventInput } from "@/api/events-api";

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

/**
 * Normalize backend SchoolEvent to ilamy CalendarEvent format
 */
export const normalizeToCalendarEvent = (event: SchoolEvent): CampusEvent => {
  return {
    id: event._id,
    _id: event._id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    allDay: event.allDay,
    description: event.objective,
    venue: event.venue,
    organizedBy: event.organizedBy,
    status: event.status,
  };
};

/**
 * Normalize ilamy CalendarEvent to backend SchoolEventInput format
 * Handles date/time extraction based on allDay flag
 */
export const normalizeToSchoolEventInput = (
  eventData: any,
  existingEvent?: SchoolEvent
): SchoolEventInput => {
  // Convert Date objects to ISO date strings (YYYY-MM-DD)
  const startDate = eventData.start instanceof Date
    ? eventData.start.toISOString().split('T')[0]
    : eventData.start;
  
  const endDate = eventData.end instanceof Date
    ? eventData.end.toISOString().split('T')[0]
    : eventData.end;

  // Extract time if not all day (HH:MM format)
  let startTime: string | undefined;
  let endTime: string | undefined;
  
  if (!eventData.allDay) {
    if (eventData.start instanceof Date) {
      startTime = eventData.start.toTimeString().slice(0, 5); // HH:MM
    }
    if (eventData.end instanceof Date) {
      endTime = eventData.end.toTimeString().slice(0, 5); // HH:MM
    }
  }

  const payload: SchoolEventInput = {
    title: eventData.title,
    objective: eventData.description || eventData.objective || "",
    allDay: eventData.allDay,
    startDate,
    endDate,
    venue: eventData.venue || "",
    organizedBy: "admin",
  };

  // Only include time fields if not all day
  if (!eventData.allDay) {
    payload.startTime = startTime;
    payload.endTime = endTime;
  }

  return payload;
};

class EventService {
  /**
   * Get all events from backend
   */
  async getEvents(params?: any) {
    const response = await eventsAPI.getAll(params);
    return response.data;
  }

  /**
   * Get single event by ID
   */
  async getEventById(id: string) {
    const response = await eventsAPI.getById(id);
    return response.data;
  }

  /**
   * Create new event
   */
  async createEvent(eventData: any) {
    const normalizedData = normalizeToSchoolEventInput(eventData);
    const response = await eventsAPI.create(normalizedData);
    return response.data;
  }

  /**
   * Update existing event
   */
  async updateEvent(id: string, eventData: any) {
    const normalizedData = normalizeToSchoolEventInput(eventData);
    const response = await eventsAPI.update(id, normalizedData);
    return response.data;
  }

  /**
   * Delete event by ID
   */
  async deleteEvent(id: string) {
    const response = await eventsAPI.delete(id);
    return response.data;
  }

  /**
   * Get event statistics
   */
  async getStats() {
    const response = await eventsAPI.getStats();
    return response.data;
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(year?: number) {
    const response = await eventsAPI.getMonthlyStats(year);
    return response.data;
  }

  /**
   * Get venue statistics
   */
  async getVenueStats() {
    const response = await eventsAPI.getVenueStats();
    return response.data;
  }

  /**
   * Filter events by date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    const response = await eventsAPI.filterByDateRange(startDate, endDate);
    return response.data;
  }
}

export const eventService = new EventService();
