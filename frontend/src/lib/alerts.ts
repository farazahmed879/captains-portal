import React from 'react';
import { createRoot } from 'react-dom/client';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';
import { ConfirmModal } from '../components/ui/ConfirmModal';

/**
 * Modern Confirmation Modal & Toast (Snackbar) Notification Library
 * Styled to perfectly match Captain's Portal design system
 */

// Common base styling options for alerts
const modalBaseOptions: SweetAlertOptions = {
  customClass: {
    popup: 'cp-swal-popup',
    title: 'cp-swal-title',
    htmlContainer: 'cp-swal-html',
    confirmButton: 'cp-swal-btn cp-swal-btn-confirm',
    cancelButton: 'cp-swal-btn cp-swal-btn-cancel',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'swal2-show',
  },
  hideClass: {
    popup: 'swal2-hide',
  },
};

/**
 * Toast / Snackbar Notification Configuration
 * Automatically auto-dismisses after 3 seconds at top-right
 */
const ToastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  customClass: {
    popup: 'cp-toast-popup',
    title: 'cp-toast-title',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const showToast = {
  success: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'success',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  error: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'error',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  warning: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'warning',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  info: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'info',
      title: title || message,
      text: title ? message : undefined,
    });
  },
};

export interface ConfirmDialogOptions {
  title: string;
  subtitle?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
  isDanger?: boolean;
  requireDeleteSecurity?: boolean;
}

/**
 * Promise-based confirmation modal using Captain's Portal ConfirmModal UI component
 * @returns Promise<boolean> resolves to true if confirmed, false if cancelled
 */
export function confirmDialog({
  title,
  subtitle,
  text,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  isDanger = false,
  requireDeleteSecurity = false,
}: ConfirmDialogOptions): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let settled = false;

    const cleanup = (result: boolean) => {
      if (settled) return;
      settled = true;
      setTimeout(() => {
        try {
          root.unmount();
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        } catch (e) {
          // Ignore unmount race
        }
      }, 0);
      resolve(result);
    };

    root.render(
      React.createElement(ConfirmModal, {
        isOpen: true,
        title,
        subtitle: subtitle || (isDanger ? 'Permanent Deletion Warning' : 'Confirmation Required'),
        message:
          text ||
          (isDanger
            ? 'This action cannot be undone and will permanently remove this record.'
            : 'Please confirm that you want to proceed with this action.'),
        confirmText: confirmButtonText,
        cancelText: cancelButtonText,
        isDanger,
        requireDeleteSecurity,
        onConfirm: () => cleanup(true),
        onClose: () => cleanup(false),
      })
    );
  });
}

/**
 * Standard Yes/No confirmation modal for single delete/deactivate/remove actions
 */
export async function confirmDelete(
  itemName: string,
  customMessage?: string,
  requireDeleteSecurity: boolean = false
): Promise<boolean> {
  return confirmDialog({
    title: `Delete ${itemName}?`,
    subtitle: 'Permanent Deletion Confirmation',
    text:
      customMessage ||
      `Are you sure you want to delete ${itemName}? This action cannot be undone and will permanently remove this record.`,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'No, Cancel',
    isDanger: true,
    requireDeleteSecurity,
  });
}

/**
 * Bulk deletion confirmation modal requiring typing "Delete" and account password
 */
export async function confirmBulkDelete(
  count: number,
  itemLabel: string,
  customMessage?: string
): Promise<boolean> {
  const pluralLabel = count === 1 ? itemLabel.replace(/s$/i, '') : itemLabel;
  return confirmDialog({
    title: `Delete ${count} Selected ${pluralLabel}?`,
    subtitle: 'Bulk Deletion Security Verification',
    text:
      customMessage ||
      `You are about to permanently delete ${count} selected ${pluralLabel.toLowerCase()}. This action cannot be undone.`,
    confirmButtonText: `Delete ${count} ${pluralLabel}`,
    cancelButtonText: 'Cancel',
    isDanger: true,
    requireDeleteSecurity: true,
  });
}

/**
 * Standard confirmation modal for clearing dues / bulk payments
 */
export async function confirmDuesClear(
  count: number,
  amount: number | string,
  targetName: string
): Promise<boolean> {
  return confirmDialog({
    title: `Clear Dues for ${targetName}?`,
    subtitle: 'Bulk Payment Confirmation',
    text: `Mark all ${count} pending match fees (Total Rs. ${amount}) as paid?`,
    confirmButtonText: 'Yes, Mark as Paid',
    cancelButtonText: 'No, Cancel',
    isDanger: false,
  });
}

/**
 * Standard Alert dialogs replacing native window.alert()
 */
export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      ...modalBaseOptions,
      icon: 'success',
      title,
      text,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'cp-swal-popup',
        title: 'cp-swal-title',
        htmlContainer: 'cp-swal-html',
        confirmButton: 'cp-swal-btn cp-swal-btn-primary',
      },
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      ...modalBaseOptions,
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Understood',
      customClass: {
        popup: 'cp-swal-popup',
        title: 'cp-swal-title',
        htmlContainer: 'cp-swal-html',
        confirmButton: 'cp-swal-btn cp-swal-btn-danger',
      },
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      ...modalBaseOptions,
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'cp-swal-popup',
        title: 'cp-swal-title',
        htmlContainer: 'cp-swal-html',
        confirmButton: 'cp-swal-btn cp-swal-btn-primary',
      },
    });
  },
  info: (title: string, text?: string) => {
    return Swal.fire({
      ...modalBaseOptions,
      icon: 'info',
      title,
      text,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'cp-swal-popup',
        title: 'cp-swal-title',
        htmlContainer: 'cp-swal-html',
        confirmButton: 'cp-swal-btn cp-swal-btn-primary',
      },
    });
  },
};

export default Swal;
