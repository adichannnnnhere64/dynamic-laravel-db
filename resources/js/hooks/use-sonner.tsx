"use client";

import { useSonner } from '@/contexts/sonner-context';

export const useNotify = () => {
  const { notify } = useSonner();

  return {
    // Quick methods
    success: (message: string, description?: string, options?: any) =>
      notify.success(message, description, options),

    error: (message: string, description?: string, options?: any) =>
      notify.error(message, description, options),

    warning: (message: string, description?: string, options?: any) =>
      notify.warning(message, description, options),

    info: (message: string, description?: string, options?: any) =>
      notify.info(message, description, options),

    // Default toast
    toast: (message: string, description?: string, options?: any) =>
      notify.default(message, description, options),

    // Promise handling
    promise: notify.promise,

    // Loading state
    loading: (message: string, description?: string, options?: any) =>
      notify.loading(message, description, options),

    // Dismiss
    dismiss: notify.dismiss,

    // Custom JSX
    custom: notify.custom,

    // Common patterns
    saved: (description?: string) =>
      notify.success('Saved successfully', description),

    deleted: (description?: string) =>
      notify.success('Deleted successfully', description),

    updated: (description?: string) =>
      notify.success('Updated successfully', description),

    created: (description?: string) =>
      notify.success('Created successfully', description),

    errorOccurred: (error?: string) =>
      notify.error('An error occurred', error || 'Please try again.'),

    copied: () => notify.success('Copied to clipboard'),

    // Form validation
    formError: (message?: string) =>
      notify.error('Form Error', message || 'Please check your input'),

    // Authentication
    loggedIn: () => notify.success('Logged in successfully'),
    loggedOut: () => notify.success('Logged out successfully'),

    // File operations
    uploaded: (description?: string) =>
      notify.success('Upload successful', description),

    downloaded: (description?: string) =>
      notify.success('Download started', description),
  };
};
