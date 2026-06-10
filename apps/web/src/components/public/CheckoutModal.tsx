import { useEffect, type MouseEvent, type ReactElement } from "react";
import CheckoutContent from "../pages/CheckoutContent";

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CheckoutModal({
  isOpen,
  onClose,
}: CheckoutModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) return;
    onClose();
  };

  return (
    <div
      aria-hidden="false"
      aria-modal="true"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm md:p-4"
      data-checkout-modal
      onClick={closeOnBackdrop}
      role="dialog"
      style={{ zIndex: 1000 }}
    >
      <div className="relative h-[92vh] w-[94vw] max-w-[760px] overflow-hidden rounded-2xl border border-white/20 bg-[#f6f8f6] sm:w-[86vw] md:h-[88vh] md:w-[56vw] lg:w-[46vw] xl:w-[40vw] 2xl:w-[36vw] dark:bg-[#102216]">
        <button
          aria-label="Fechar checkout"
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#0d1b12] hover:bg-white"
          data-checkout-modal-close
          onClick={onClose}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div className="h-full overflow-y-auto">
          <CheckoutContent />
        </div>
      </div>
    </div>
  );
}
