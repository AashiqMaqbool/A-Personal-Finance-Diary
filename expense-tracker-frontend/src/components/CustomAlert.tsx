import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface CustomAlertProps {
  type: 'success' | 'error' | 'info' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlert({ type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }: CustomAlertProps) {
  const icons = {
    success: <CheckCircle className="w-12 h-12 text-green-600" />,
    error: <AlertCircle className="w-12 h-12 text-red-600" />,
    info: <Info className="w-12 h-12 text-blue-600" />,
    confirm: <AlertCircle className="w-12 h-12 text-slate-600" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    confirm: 'bg-slate-50 border-slate-200',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`mb-4 p-3 rounded-full ${colors[type]}`}>
            {icons[type]}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600 whitespace-pre-line">{message}</p>
        </div>

        <div className="flex gap-3">
          {type === 'confirm' ? (
            <>
              <button onClick={onCancel} className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">
                {cancelText}
              </button>
              <button onClick={onConfirm} className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800">
                {confirmText}
              </button>
            </>
          ) : (
            <button onClick={onConfirm || onCancel} className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800">
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
