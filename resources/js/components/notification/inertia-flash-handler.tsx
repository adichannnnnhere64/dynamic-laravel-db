"use client";

import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useNotify } from '@/hooks/use-sonner';

interface PageProps {
  flash?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
  errors?: Record<string, string>;
}

export const InertiaFlashHandler: React.FC = () => {
  const { props } = usePage<PageProps>();
  const notify = useNotify();

  useEffect(() => {
    // Handle flash messages
    if (props.flash) {
      if (props.flash.success) {
        notify.success(props.flash.success);
      }
      if (props.flash.error) {
        notify.error(props.flash.error);
      }
      if (props.flash.warning) {
        notify.warning(props.flash.warning);
      }
      if (props.flash.info) {
        notify.info(props.flash.info);
      }
    }

    // Handle form errors
    if (props.errors && Object.keys(props.errors).length > 0) {
      const firstError = Object.values(props.errors)[0];
      notify.error('Validation Error', firstError);
    }
  }, [props.flash, props.errors, notify]);

  return null; // This component doesn't render anything
};
