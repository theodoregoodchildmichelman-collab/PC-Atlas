import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import UploadForm from './components/UploadForm';
import Feed from './components/Feed';
import DetailModal from './components/DetailModal';
import NameEntry from './components/NameEntry';

/*
FIRESTORE SCHEMA
... (same as before)
*/

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem('pc_atlas_username') || '');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    // Zero-Friction Access: Anonymous Auth
    signInAnonymously(auth).catch((error) => {
      console.error("Auth Error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleNameSubmit = (name) => {
    setUserName(name);
    localStorage.setItem('pc_atlas_username', name);
  };

  if (!userName) {
    return <NameEntry onComplete={handleNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 font-sans pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="glass sticky top-0 z-10 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight flex items-center gap-2">
            Мировен Корпус Атлас {/* v1.1 */}
          </h1>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-full border border-gray-200 flex shadow-inner">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Map
              </button>
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 text-center sm:text-left animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Share knowledge: <span className="text-blue-600">volunteer</span> to <span className="text-blue-600">volunteer</span>.
          </h2>
          <p className="text-gray-500 text-lg">A centralized repository of educational best practices, camp itineraries, and club guides.</p>
        </div>

        <Feed onResourceClick={setSelectedResource} viewMode={viewMode} />
      </main>

      {showUpload && <UploadForm onClose={() => setShowUpload(false)} userName={userName} />}
      {selectedResource && <DetailModal resource={selectedResource} onClose={() => setSelectedResource(null)} userName={userName} />}
    </div>
  );
}

export default App;
