import { useState } from 'react';

function NameEntry({ onComplete }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onComplete(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full mx-4 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h2>
                <p className="text-gray-500 mb-8">Please type your name to continue.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg text-center"
                        autoFocus
                        required
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Enter
                    </button>
                </form>
            </div>
        </div>
    );
}

export default NameEntry;
