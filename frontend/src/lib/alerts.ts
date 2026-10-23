import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

/**
 * Modern SweetAlert2 & Toast (Snackbar) Notification Library
 * Styled to perfectly match Captain's Portal design system
 */

// Common base styling options for modals
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
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
  isDanger?: boolean;
}

/**
 * Beautiful, Promise-based confirmation dialog replacing window.confirm()
 * @returns Promise<boolean> resolves to true if confirmed, false if cancelled
 */
export async function confirmDialog({
  title,
  text,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  icon = 'warning',
  isDanger = false,
}: ConfirmDialogOptions): Promise<boolean> {
  const result = await Swal.fire({
    ...modalBaseOptions,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: isDanger,
    customClass: {
      popup: 'cp-swal-popup',
      title: 'cp-swal-title',
      htmlContainer: 'cp-swal-html',
      confirmButton: `cp-swal-btn ${isDanger ? 'cp-swal-btn-danger' : 'cp-swal-btn-primary'}`,
      cancelButton: 'cp-swal-btn cp-swal-btn-cancel',
    },
  });

  return result.isConfirmed;
}

/**
 * Standard confirmation dialog for delete/deactivate actions
 */
export async function confirmDelete(
  itemName: string,
  customMessage?: string
): Promise<boolean> {
  return confirmDialog({
    title: `Delete ${itemName}?`,
    text: customMessage || 'This action cannot be undone and will permanently remove this record.',
    icon: 'warning',
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    isDanger: true,
  });
}

/**
 * Standard confirmation dialog for clearing dues / bulk payments
 */
export async function confirmDuesClear(
  count: number,
  amount: number | string,
  targetName: string
): Promise<boolean> {
  return confirmDialog({
    title: `Clear Dues for ${targetName}?`,
    text: `Mark all ${count} pending match fees (Total Rs. ${amount}) as paid?`,
    icon: 'question',
    confirmButtonText: 'Yes, Mark as Paid',
    cancelButtonText: 'Cancel',
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
