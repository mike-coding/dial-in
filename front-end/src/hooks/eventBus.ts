// Simple event bus for decoupled store communication
type EventHandler<T = any> = (data: T) => void;

class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  emit<T>(event: string, data: T): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  off(event: string): void {
    this.listeners.delete(event);
  }
}

export const eventBus = new EventBus();

// Event types for type safety
export interface UserDataLoadedEvent {
  userId: number;
  categories: any[];
  tasks: any[];
  events: any[];
  rules: any[];
}

export interface AuthStatusChangedEvent {
  isAuthenticated: boolean;
  userData: any | null;
}

export interface DataLoadingEvent {
  userId: number;
  domain: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
}
