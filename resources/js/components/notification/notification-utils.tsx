"use client";

import React from 'react';
import { Notification } from './notification';
import { toast } from 'sonner';

export const showNotification = {
  success: (title: string, description?: string) => {
    toast.custom((t) => (
      <Notification
        type="success"
        title={title}
        description={description}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },

  error: (title: string, description?: string) => {
    toast.custom((t) => (
      <Notification
        type="error"
        title={title}
        description={description}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },

  warning: (title: string, description?: string) => {
    toast.custom((t) => (
      <Notification
        type="warning"
        title={title}
        description={description}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },

  info: (title: string, description?: string) => {
    toast.custom((t) => (
      <Notification
        type="info"
        title={title}
        description={description}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },

  loading: (title: string, description?: string) => {
    return toast.custom((t) => (
      <Notification
        type="loading"
        title={title}
        description={description}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },
};
