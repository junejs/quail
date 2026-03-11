'use client';

import { create } from 'zustand';
import { ReactNode, useState } from 'react';

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for no auto-dismiss
}

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for no auto-dismiss
}

interface ErrorStore {
  notifications: ErrorNotification[];
  addNotification: (notification: Omit<ErrorNotification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    // Auto-dismiss after duration (if specified)
    if (notification.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, notification.duration || 5000);
    }

    return id;
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  },
}));

// Convenience functions for common error types
export const showError = (title: string, message: string, duration?: number) => {
  return useErrorStore.getState().addNotification({
    type: 'error',
    title,
    message,
    duration,
  });
};

export const showWarning = (title: string, message: string, duration?: number) => {
  return useErrorStore.getState().addNotification({
    type: 'warning',
    title,
    message,
    duration,
  });
};

export const showInfo = (title: string, message: string, duration?: number) => {
  return useErrorStore.getState().addNotification({
    type: 'info',
    title,
    message,
    duration,
  });
};

// Error handler for async operations
export const handleAsyncError = async (
  operation: () => Promise<void>,
  errorTitle: string = 'Operation failed'
): Promise<boolean> => {
  try {
    await operation();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    showError(errorTitle, message);
    return false;
  }
};

// Socket error handler
export const handleSocketError = (error: Error, context: string) => {
  console.error(`Socket error in ${context}:`, error);
  showError(
    'Connection Error',
    `${context}: ${error.message}. Please check your connection and try again.`,
    0 // Don't auto-dismiss connection errors
  );
};

// Database error handler
export const handleDatabaseError = (error: unknown, context: string) => {
  console.error(`Database error in ${context}:`, error);
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  showError(
    'Database Error',
    `${context}: ${message}. Please try again.`,
    5000
  );
};
