import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info'
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="text-error" size={48} />;
      case 'warning': return <AlertCircle className="text-warning" size={48} />;
      default: return <AlertCircle className="text-primary" size={48} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="confirm-modal-overlay" onClick={onCancel}>
        <motion.div 
          className="confirm-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="confirm-buttons">
            <button className="btn-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button 
              className={type === 'danger' ? 'btn-primary-glow bg-error' : 'btn-primary-glow'}
              onClick={onConfirm}
              style={type === 'danger' ? { background: 'var(--error)' } : {}}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
