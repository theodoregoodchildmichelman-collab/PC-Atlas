import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        info: 'bg-gray-900',
        success: 'bg-green-600',
        error: 'bg-red-600'
    };

    const icons = {
        info: 'info',
        success: 'check_circle',
        error: 'error'
    };

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl text-white animate-fade-in-up ${bgColors[type]}`}>
            <span className="material-symbols-rounded text-xl">{icons[type]}</span>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
                <span className="material-symbols-rounded text-lg">close</span>
            </button>
        </div>
    );
}
