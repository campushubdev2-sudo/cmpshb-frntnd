import { useEffect, useState } from "react";
import { eventService, type CampusEventDTO } from "../services/school-event-service";

export const useSchoolEvents = () => {
  const [schoolEvents, setSchoolEvents] = useState<CampusEventDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadSchoolEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents();

      const cleaned: CampusEventDTO[] = data.data.map((event: any) => ({
        _id: event._id,
        title: event.title,
        objective: event.objective,
        start: event.startDate,
        end: event.endDate,
        allDay: event.allDay,
        venue: event.venue,
      }));

      setSchoolEvents(cleaned);
    } catch (error) {
      console.error(error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolEvents();
  }, []);

  return { schoolEvents, loadSchoolEvents, loading, error };
};
