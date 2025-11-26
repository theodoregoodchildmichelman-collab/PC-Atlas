import { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { MKD_LOCATIONS } from '../data/locations';

export default function UploadForm({ onClose, userName, initialData }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [timeCommitment, setTimeCommitment] = useState('Quick (< 1 hour)');
  const [cost, setCost] = useState('Free (0 MKD)');
  const [audience, setAudience] = useState('Mixed Group');
  const [location, setLocation] = useState('Skopje');
  const [coordinates, setCoordinates] = useState(null); // Add coordinates state
  const [locationQuery, setLocationQuery] = useState(''); // Add locationQuery state
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false); // Add suggestions state
  const [filteredLocations, setFilteredLocations] = useState([]); // Add filtered locations state

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);
    // setLocation(value); // Don't set location yet, wait for select? Or allow free text?
    // Let's allow free text but prefer selection.
    setLocation(value);

    if (value.length > 0) {
      const filtered = MKD_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setLocationQuery(loc.name);
    setLocation(loc.name);
    setCoordinates(new GeoPoint(loc.lat, loc.lng));
    setShowLocationSuggestions(false);
  };

  // Pre-fill data if editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || '');
      setTags(initialData.tags || []);
      setTimeCommitment(initialData.timeCommitment || 'Quick (< 1 hour)');
      setCost(initialData.cost || 'Free (0 MKD)');
      setAudience(initialData.audience || 'Mixed Group');
      setLocation(initialData.location || 'Skopje');
      // File is optional when editing
    }
  }, [initialData]);

  const categories = ['Camps', 'Clubs', 'EE Lesson Plans', 'CD Resources'];

  const locations = [
    'Skopje', 'Bitola', 'Tetovo', 'Stip', 'Prilep', 'Ohrid', 'Kumanovo', 'Veles',
    'Strumica', 'Kocani', 'Gostivar', 'Kavadarci', 'Gevgelija', 'Struga',
    'Radovish', 'Debar', 'Probistip', 'Sveti Nikole'
  ];

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) return;
    if (!initialData && !file) return; // File required only for new uploads

    setIsUploading(true);
    try {
      let downloadURL = initialData?.fileURL;
      let fileName = initialData?.fileName;
      let fileSize = initialData?.fileSize;

      // 1. Upload File to Storage (if new file selected)
      if (file) {
        const fileRef = ref(storage, `resources/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        downloadURL = await getDownloadURL(snapshot.ref);
        fileName = file.name;
        fileSize = (file.size / (1024 * 1024)).toFixed(2);
      }

      // Ensure category is included in tags
      const finalTags = tags.includes(category) ? tags : [category, ...tags];

      const resourceData = {
        title,
        description,
        category,
        tags: finalTags,
        fileURL: downloadURL,
        fileName: fileName,
        fileSize: fileSize,
        timeCommitment,
        cost,
        audience,
        location,
        coordinates: coordinates || null, // Include coordinates
        // Don't update createdAt, userId, authorName, likes, etc. on edit
      };

      if (initialData) {
        // Update existing doc
        const resourceRef = doc(db, 'resources', initialData.id);
        await updateDoc(resourceRef, resourceData);
        console.log("Update successful!");
      } else {
        // Create new doc
        await addDoc(collection(db, 'resources'), {
          ...resourceData,
          createdAt: serverTimestamp(),
          userId: auth.currentUser.uid,
          authorName: userName || 'Anonymous',
          likes: 0,
          likedBy: [],
          upvotes: 0,
          upvotedBy: []
        });
        console.log("Upload successful!");
      }

      onClose();
    } catch (error) {
      console.error("Error saving resource:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-slide-up border border-white/50 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{initialData ? 'Edit Resource' : 'Share Resource'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              placeholder="e.g., 5th Grade English Lesson Plan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category (Required)</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
              disabled={isUploading}
            >
              <option value="" disabled>Select a category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
              <select
                value={timeCommitment}
                onChange={(e) => setTimeCommitment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none text-sm"
                disabled={isUploading}
              >
                <option>Quick (&lt; 1 hour)</option>
                <option>Medium (Half-day)</option>
                <option>High (Multi-day)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cost</label>
              <select
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none text-sm"
                disabled={isUploading}
              >
                <option>Free (0 MKD)</option>
                <option>Low Cost</option>
                <option>Grant Required</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Group</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none text-sm"
                disabled={isUploading}
              >
                <option>Primary School</option>
                <option>High School</option>
                <option>Adults</option>
                <option>Mixed Group</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location (City/Village)</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                placeholder="Start typing a city..."
                value={locationQuery}
                onChange={handleLocationChange}
                onFocus={() => locationQuery && setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 100)} // Delay to allow click on suggestion
                disabled={isUploading}
              />
              {showLocationSuggestions && filteredLocations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleLocationSelect(loc)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors text-sm text-gray-700"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              required
              rows="3"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none outline-none"
              placeholder="What is this? How should it be used?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (Optional)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span key={tag} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900" disabled={isUploading}>×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              placeholder="Add tags (e.g., English, Science)..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">File {initialData ? '(Optional - leave empty to keep existing)' : ''}</label>
            <div className="relative group">
              <input
                type="file"
                required={!initialData}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer border border-gray-200 rounded-xl p-2"
                onChange={(e) => setFile(e.target.files[0])}
                disabled={isUploading}
              />
            </div>
            {/* Simple File Info */}
            {(file || initialData?.fileName) && (
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                <span className="material-symbols-rounded text-indigo-500">description</span>
                <span className="font-medium">{file ? file.name : initialData.fileName}</span>
                <span className="text-gray-400">({file ? (file.size / (1024 * 1024)).toFixed(2) : initialData.fileSize} MB)</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full font-bold py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 mt-4 ${isUploading
              ? 'bg-gray-400 cursor-not-allowed text-gray-100'
              : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-gray-900/20'
              }`}
          >
            {isUploading ? (
              <>
                <span className="material-symbols-rounded animate-spin">progress_activity</span>
                {initialData ? 'Updating...' : 'Uploading...'}
              </>
            ) : (
              initialData ? 'Update Resource' : 'Upload Resource'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
