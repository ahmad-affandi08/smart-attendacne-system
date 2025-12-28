'use client';

import { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  isLoading = false,
}: AlertDialogProps) {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex items-center justify-center pt-6">
            <div className={`${config.bgColor} rounded-full p-3`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              className={`flex-1 ${config.buttonClass}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
