// src/firebase/error-emitter.ts
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

// Define the types for the events you want to emit
interface ErrorEvents {
  'permission-error': (error: FirestorePermissionError) => void;
}

class TypedEventEmitter<T> {
  private emitter = new EventEmitter();

  on<K extends keyof T>(event: K, listener: T[K]): void {
    this.emitter.on(event as string, listener);
  }

  off<K extends keyof T>(event: K, listener: T[K]): void {
    this.emitter.off(event as string, listener);
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    this.emitter.emit(event as string, ...args);
  }
}

// Create a singleton instance of the typed event emitter
export const errorEmitter = new TypedEventEmitter<ErrorEvents>();
