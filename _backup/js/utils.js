/**
 * ==========================================
 * MODULE: UTILITIES
 * ==========================================
 */
export const Utils = {
    generateId: () => Math.random().toString(36).substr(2, 9),

    formatDate: (dateVal) => {
        if (!dateVal) return 'Unknown Date';
        const date = new Date(dateVal);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    timeAgo: (dateVal) => {
        if (!dateVal) return '';
        const date = new Date(dateVal);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    },

    getStoredAuthor: () => {
        return localStorage.getItem('riznica_author_name') || "";
    },

    setStoredAuthor: (name) => {
        if(name && name.trim() !== "") {
            localStorage.setItem('riznica_author_name', name);
        }
    },

    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return; // Guard clause
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'check_circle' : 'error';

        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${bgColor} transform translate-y-10 opacity-0 transition-all duration-300`;
        toast.innerHTML = `
        <span class="material-symbols-rounded text-xl">${icon}</span>
        <span class="font-medium text-sm">${message}</span>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};