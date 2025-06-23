// This file contains mock data for initial Google Calendar integration
// In production, this would be replaced with actual Google Calendar API calls

export const mockCalendarEvents = [
  {
    id: "google_event_1",
    title: "Team Standup",
    start: new Date(2024, 5, 23, 9, 0),
    end: new Date(2024, 5, 23, 10, 0),
    location: "Conference Room A",
    attendees: ["john@example.com", "jane@example.com"],
  },
  {
    id: "google_event_2",
    title: "Client Presentation",
    start: new Date(2024, 5, 23, 14, 0),
    end: new Date(2024, 5, 23, 16, 0),
    location: "Event Space C",
    attendees: ["client@company.com", "sales@example.com"],
  },
  {
    id: "google_event_3",
    title: "Project Review",
    start: new Date(2024, 5, 23, 16, 30),
    end: new Date(2024, 5, 23, 17, 30),
    location: "Meeting Room B",
    attendees: ["team@example.com"],
  },
];

export const mockGoogleCalendarIntegration = {
  isAuthenticated: false,
  
  async authenticate() {
    // Mock authentication flow
    return new Promise(resolve => {
      setTimeout(() => {
        this.isAuthenticated = true;
        resolve(true);
      }, 1000);
    });
  },

  async getEvents(startDate: Date, endDate: Date) {
    // Mock API call to get events
    return new Promise(resolve => {
      setTimeout(() => {
        const filteredEvents = mockCalendarEvents.filter(event =>
          event.start >= startDate && event.end <= endDate
        );
        resolve(filteredEvents);
      }, 500);
    });
  },

  async createEvent(eventData: any) {
    // Mock event creation
    return new Promise(resolve => {
      setTimeout(() => {
        const newEvent = {
          id: `google_event_${Date.now()}`,
          ...eventData,
        };
        mockCalendarEvents.push(newEvent);
        resolve(newEvent);
      }, 500);
    });
  },

  async updateEvent(eventId: string, eventData: any) {
    // Mock event update
    return new Promise(resolve => {
      setTimeout(() => {
        const eventIndex = mockCalendarEvents.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
          mockCalendarEvents[eventIndex] = { ...mockCalendarEvents[eventIndex], ...eventData };
          resolve(mockCalendarEvents[eventIndex]);
        }
        resolve(null);
      }, 500);
    });
  },

  async deleteEvent(eventId: string) {
    // Mock event deletion
    return new Promise(resolve => {
      setTimeout(() => {
        const eventIndex = mockCalendarEvents.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
          mockCalendarEvents.splice(eventIndex, 1);
          resolve(true);
        }
        resolve(false);
      }, 500);
    });
  },
};
