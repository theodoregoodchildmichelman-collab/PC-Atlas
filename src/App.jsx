import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, NavLink } from 'react-router-dom';
import { auth } from './firebase';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ToastProvider } from './components/ToastContext';
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
  const [isUploadOpen, setIsUploadOpen] = useState(false); // Added missing state
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
    setIsUploadOpen(true);
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
  };

  const handleLogin = () => {
    // Placeholder for login logic
    console.log("Login clicked");
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Sign out error", error));
  };

  if (!userName) {
    return <NameEntry onComplete={handleNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <span className="material-symbols-rounded text-2xl">public</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                Peace Corps Atlas
              </h1>
              <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">North Macedonia</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-full">
            <NavLink to="/" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-symbols-rounded text-lg">home</span>
              Feed
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-symbols-rounded text-lg">map</span>
              Atlas
            </NavLink>
            <NavLink to="/saved" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-symbols-rounded text-lg">bookmark</span>
              Saved
            </NavLink>
          </nav>

          {/* User Profile / Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900">{userName}</span>
                  <span className="text-xs text-gray-500">Volunteer</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={handleLogout} title="Click to Logout">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-indigo-600 text-lg">{userName ? userName[0] : 'U'}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-rounded text-lg">login</span>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        <Routes>
          <Route path="/" element={
            <Feed
              onResourceClick={handleResourceClick}
              viewMode={viewMode}
              userName={userName}
              onEdit={handleEditResource}
            />
          } />
          <Route path="/map" element={<AtlasMap onResourceClick={handleResourceClick} />} />
          <Route path="/saved" element={<SavedResources onResourceClick={handleResourceClick} userName={userName} onEdit={handleEditResource} />} />
        </Routes>
      </main>

      {/* Floating Action Button (Upload) */}
      {user && (
        <button
          onClick={() => setIsUploadOpen(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 bg-gray-900 text-white pl-5 pr-6 py-4 rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all z-40 flex items-center gap-3 group"
        >
          <span className="material-symbols-rounded text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
          <span className="font-bold text-lg tracking-wide">Share</span>
        </button>
      )}

      {/* Modals */}
      {isUploadOpen && (
        <UploadForm
          onClose={() => {
            setIsUploadOpen(false);
            setEditingResource(null);
          }}
          userName={userName}
          initialData={editingResource}
        />
      )}

      {selectedResource && (
        <DetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          userName={userName}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
