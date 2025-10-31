
import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We need to declare the `EventEmitter` type to correctly type `TypedEventEmitter`
declare interface TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  on<K extends keyof T>(event: K, listener: T[K]): this;
  off<K extends keyof T>(event: K, listener: T[K]): this;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean;
}

// Then we can extend it with our own events
class TypedEventEmitter<
  T extends Record<string, (...args: any[]) => void>
> extends EventEmitter {}

export const errorEmitter = new TypedEventEmitter<AppEvents>();
