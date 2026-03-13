import { useEffect, useRef } from "react";

/**
 * WCAG 2.1: Focus management and Escape for dialogs.
 * - Focus first focusable on open
 * - Escape closes
 * - Restore focus on close
 */
export function useDialogAccessibility(
  isOpen: boolean,
  onClose: () => void,
  /** Optional ref to the dialog container; if not provided, focuses first focusable */
  containerRef?: React.RefObject<HTMLElement | null>
) {
  const previousActiveRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveRef.current = document.activeElement as Element | null;

    const focusTarget = containerRef?.current ?? document.body;
    const firstFocusable = focusTarget.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      (previousActiveRef.current as HTMLElement | null)?.focus();
    };
  }, [isOpen, onClose, containerRef]);
}
