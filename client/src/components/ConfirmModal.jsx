import Button from "./Button";
import "./ConfirmModal.css";

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  onClose,
  destructive = false,
}) {
  if (!open) return null;

  return (
    <div
      className="confirm-modal__overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {message && <p>{message}</p>}

        <div className="confirm-modal__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel || onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={destructive ? "confirm-modal__confirm--danger" : ""}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
