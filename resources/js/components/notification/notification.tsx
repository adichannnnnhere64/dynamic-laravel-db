"use client";

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  title,
  description,
  action,
  onClose,
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
  };

  const colors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    loading: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      "p-4 rounded-lg border shadow-sm",
      colors[type]
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn(
          "w-5 h-5 flex-shrink-0 mt-0.5",
          type === 'loading' && "animate-spin"
        )} />
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm mt-1 opacity-90">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium underline underline-offset-2"
            >
              {action.label}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
