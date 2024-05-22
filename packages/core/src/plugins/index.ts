import { ChatPlugin } from './chat';

export interface Plugins {
  readonly chat?: ChatPlugin;
}

export * from './chat';
