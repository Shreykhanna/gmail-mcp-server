import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

type EventDetails = {
  summary: string;
  location: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: any;
};

export const createCalendarEvent = async (
  auth: OAuth2Client,
  details: EventDetails
) => {
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: details.summary, // Meeting Title
    location: details.location || "",
    description: details.description || "",
    start: {
      dateTime: details.startTime, // Format: '2026-05-28T09:00:00-07:00'
      timeZone: "UTC",
    },
    end: {
      dateTime: details.endTime,
      timeZone: "UTC",
    },
    attendees: details.attendees
      ? details.attendees.map((email: string) => ({ email }))
      : [],
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};
