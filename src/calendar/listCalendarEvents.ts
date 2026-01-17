import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const listCalendarEvents = async (auth: OAuth2Client) => {
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(), // Only get events starting from now
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items;

    if (!events || events.length === 0) {
      console.log("No upcoming events found.");
      return [];
    }

    // Map the events to a cleaner format
    return events.map((event) => ({
      start: event.start?.dateTime || event.start?.date,
      summary: event.summary,
      description: event.description,
      location: event.location,
    }));
  } catch (error) {
    console.error("The API returned an error: " + error);
    throw error;
  }
};
