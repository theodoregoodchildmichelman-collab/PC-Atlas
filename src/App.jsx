import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import UploadForm from './components/UploadForm';
import Feed from './components/Feed';
import DetailModal from './components/DetailModal';
import NameEntry from './components/NameEntry';
import SavedResources from './pages/SavedResources';
import AtlasMap from './pages/AtlasMap';

/*
FIRESTORE SCHEMA
... (same as before)
*/

function AppContent() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem('pc_atlas_username') || '');
  const [showUpload, setShowUpload] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const location = useLocation();

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

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowUpload(true);
  };

  if (!userName) {
    return <NameEntry onComplete={handleNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 font-sans pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="glass sticky top-0 z-10 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight flex items-center gap-2">
            Мировен Корпус Атлас {/* v1.1 */}
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/map"
                className="text-gray-600 hover:text-atlas-blue px-4 py-2 rounded-full font-bold hover:bg-indigo-50 transition-all flex items-center gap-2"
                title="Atlas Map"
              >
                <span className="material-symbols-rounded">map</span>
                <span className="hidden sm:inline">Atlas</span>
              </Link>

              <Link
                to="/my-saved-resources"
                className="text-gray-600 hover:text-red-500 px-4 py-2 rounded-full font-bold hover:bg-red-50 transition-all flex items-center gap-2"
                title="Saved Resources"
              >
                <span className="material-symbols-rounded">favorite</span>
                <span className="hidden sm:inline">Saved</span>
              </Link>

              <button
                onClick={() => setShowUpload(true)}
                className="bg-atlas-blue text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-500/20 hover:bg-opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-rounded">add</span>
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {location.pathname === '/' && (
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
              Share knowledge. <br className="hidden sm:block" />
              <span className="text-atlas-blue">Volunteer</span> to <span className="text-atlas-blue">volunteer</span>.
            </h2>
            <p className="text-gray-500 text-lg sm:text-xl max-w-2xl mx-auto">
              A centralized repository of educational best practices, camp itineraries, and club guides for Peace Corps Macedonia.
            </p>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Feed onResourceClick={setSelectedResource} viewMode={viewMode} userName={userName} onEdit={handleEditResource} />} />
          <Route path="/map" element={<AtlasMap onResourceClick={setSelectedResource} />} />
          <Route path="/my-saved-resources" element={<SavedResources onResourceClick={setSelectedResource} userName={userName} onEdit={handleEditResource} />} />
        </Routes>
      </main>

      {showUpload && (
        <UploadForm
          onClose={() => { setShowUpload(false); setEditingResource(null); }}
          userName={userName}
          initialData={editingResource}
        />
      )}
      {selectedResource && <DetailModal resource={selectedResource} onClose={() => setSelectedResource(null)} userName={userName} />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
