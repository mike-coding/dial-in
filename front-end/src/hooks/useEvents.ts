import { create } from 'zustand';
import React from 'react';
import { Event } from './types';
import { useUserDataStore } from './useUserData';
import { eventBus, UserDataLoadedEvent, AuthStatusChangedEvent } from './eventBus';
import { createApiUrl } from './apiConfig';

// Verbose flag for debug logging
const VERBOSE_DEBUG = false;

interface EventsStore {
  events: Event[];
  hasPendingWrites: boolean;
  addEvent: (event: Omit<Event, 'id' | 'user_id' | 'created_at'>) => void;
  updateEvent: (id: number, changes: Partial<Event>) => void;
  deleteEvent: (id: number) => void;
  setEvents: (events: Event[]) => void;
  clearEvents: () => void;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  hasPendingWrites: false,
  
  setEvents: (events) => set({ events }),
  
  clearEvents: () => set({
    events: [],
    hasPendingWrites: false,
  }),
  
  addEvent: (eventData) => {
    const userData = useUserDataStore.getState().userData;
    if (!userData) {
      console.error("❌ addEvent called but userData is null!");
      return;
    }

    if (VERBOSE_DEBUG) console.log("➕ Adding event:", eventData);

    // Optimistic update: Create temporary event with placeholder ID
    const tempEvent = {
      ...eventData,
      id: Date.now(), // Temporary ID
      user_id: userData.id,
      created_at: new Date().toISOString(),
    };
    
    const { events } = get();
    set({ 
      events: [...events, tempEvent],
      hasPendingWrites: true,
    });

    const apiUrl = createApiUrl('/events');

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...eventData, user_id: userData.id }),
    })
      .then((res) => res.json())
      .then((newEvent) => {
        // Replace temporary event with real event from server
        const { events } = get();
        const finalEvents = events.map((event) =>
          event.id === tempEvent.id ? newEvent : event
        );
        
        // Check if this was the last pending write
        const stillHasPendingWrites = finalEvents.some(event => 
          event.id > Date.now() - 10000 // Temp IDs from last 10 seconds
        );
        
        set({ 
          events: finalEvents,
          hasPendingWrites: stillHasPendingWrites,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Event added successfully:", newEvent);
      })
      .catch((err) => {
        console.error("❌ Error adding event:", err);
        // Revert optimistic update on error
        const { events } = get();
        const revertedEvents = events.filter(event => event.id !== tempEvent.id);
        
        set({ 
          events: revertedEvents,
          hasPendingWrites: revertedEvents.some(event => event.id > Date.now() - 10000),
        });
      });
  },

  updateEvent: (id, changes) => {
    if (VERBOSE_DEBUG) console.log(`🔄 Updating event ${id}:`, changes);

    const { events } = get();
    const originalEvent = events.find(e => e.id === id);
    
    // Optimistic update
    const updatedEvents = events.map(event => 
      event.id === id ? { ...event, ...changes } : event
    );
    
    set({ 
      events: updatedEvents,
      hasPendingWrites: true,
    });
    
    const apiUrl = createApiUrl(`/events/${id}`);
    
    fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    })
      .then((res) => res.json())
      .then((updatedEvent) => {
        const { events } = get();
        const finalEvents = events.map(event => 
          event.id === id ? updatedEvent : event
        );
        
        set({ 
          events: finalEvents,
          hasPendingWrites: false,
        });
        
        if (VERBOSE_DEBUG) console.log("✅ Event updated successfully:", updatedEvent);
      })
      .catch((err) => {
        console.error("❌ Error updating event:", err);
        // Revert to original on error
        if (originalEvent) {
          const { events } = get();
          const revertedEvents = events.map(event => 
            event.id === id ? originalEvent : event
          );
          set({ 
            events: revertedEvents,
            hasPendingWrites: false,
          });
        }
      });
  },

  deleteEvent: (id) => {
    if (VERBOSE_DEBUG) console.log(`🗑️ Deleting event ${id}`);

    const { events } = get();
    const originalEvents = [...events];
    const filteredEvents = events.filter(event => event.id !== id);
    
    set({ 
      events: filteredEvents,
      hasPendingWrites: true,
    });
    
    const apiUrl = createApiUrl(`/events/${id}`);
    
    fetch(apiUrl, { method: "DELETE" })
      .then(() => {
        set({ hasPendingWrites: false });
        if (VERBOSE_DEBUG) console.log("✅ Event deleted successfully");
      })
      .catch((err) => {
        console.error("❌ Error deleting event:", err);
        // Revert deletion on error
        set({ 
          events: originalEvents,
          hasPendingWrites: false,
        });
      });
  },
}));

// Listen for user data loaded events
eventBus.on<UserDataLoadedEvent>('user-data-loaded', (data) => {
  useEventsStore.getState().setEvents(data.events);
});

// Listen for auth status changes
eventBus.on<AuthStatusChangedEvent>('auth-status-changed', (data) => {
  if (!data.isAuthenticated) {
    useEventsStore.getState().clearEvents();
  }
});

export const useEvents = () => {
  const events = useEventsStore((state) => state.events);
  const hasPendingWrites = useEventsStore((state) => state.hasPendingWrites);
  const addEvent = useEventsStore((state) => state.addEvent);
  const updateEvent = useEventsStore((state) => state.updateEvent);
  const deleteEvent = useEventsStore((state) => state.deleteEvent);
  
  return React.useMemo(
    () => ({ 
      // Clean, simple API
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      
      // Debug/sync state (for developer use)
      hasPendingWrites,
    }),
    [events, addEvent, updateEvent, deleteEvent, hasPendingWrites]
  );
};
