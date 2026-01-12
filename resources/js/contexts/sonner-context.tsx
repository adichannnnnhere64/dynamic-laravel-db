"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { Toaster, toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface NotificationContextType {
  notify: {
    success: (message: string, description?: string, options?: any) => string | number;
    error: (message: string, description?: string, options?: any) => string | number;
    warning: (message: string, description?: string, options?: any) => string | number;
    info: (message: string, description?: string, options?: any) => string | number;
    default: (message: string, description?: string, options?: any) => string | number;
    promise: typeof toast.promise;
    loading: (message: string, description?: string, options?: any) => string | number;
    dismiss: (id?: string | number) => void;
    custom: (jsx: React.ReactNode, options?: any) => string | number;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useSonner = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useSonner must be used within SonnerProvider');
  }
  return context;
};

interface SonnerProviderProps {
  children: ReactNode;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  theme?: "light" | "dark" | "system";
  richColors?: boolean;
  closeButton?: boolean;
  expand?: boolean;
}

export const SonnerProvider: React.FC<SonnerProviderProps> = ({
  children,
  position = "top-right",
  theme = "light",
  richColors = true,
  closeButton = true,
  expand = false
}) => {

  const notify = {
    success: (message: string, description?: string, options?: any) =>
      toast.success(message, { description, ...options }),

    error: (message: string, description?: string, options?: any) =>
      toast.error(message, { description, ...options }),

    warning: (message: string, description?: string, options?: any) =>
      toast.warning(message, { description, ...options }),

    info: (message: string, description?: string, options?: any) =>
      toast.info(message, { description, ...options }),

    default: (message: string, description?: string, options?: any) =>
      toast(message, { description, ...options }),

    promise: toast.promise,

    loading: (message: string, description?: string, options?: any) =>
      toast.loading(message, { description, ...options }),

    dismiss: (id?: string | number) => toast.dismiss(id),

    custom: (jsx: React.ReactNode, options?: any) =>
      toast.custom(jsx, options),
  };

  const value = {
    notify,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position={position}
        theme={theme}
        richColors={richColors}
        closeButton={closeButton}
        expand={expand}
        className="toaster group"
      />
    </NotificationContext.Provider>
  );
};
