import { useState } from 'react';
import { db, storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function UploadForm({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [timeCommitment, setTimeCommitment] = useState('Quick (< 1 hour)');
  const [cost, setCost] = useState('Free (0 MKD)');
  const [audience, setAudience] = useState('Mixed Group');
  const [location, setLocation] = useState('Skopje');

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
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Upload File to Storage
      const fileRef = ref(storage, `resources/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Save Metadata to Firestore
      await addDoc(collection(db, 'resources'), {
        title,
        description,
        tags,
        timeCommitment,
        cost,
        audience,
        location,
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2), // MB
        fileType: file.type,
        authorName: auth.currentUser ? 'Volunteer' : 'Anonymous', // Could be improved with user profiles
        userId: auth.currentUser ? auth.currentUser.uid : 'anon',
        createdAt: serverTimestamp(),
        downloadCount: 0
      });

      console.log("Upload successful!");
      onClose();
    } catch (error) {
      console.error("Error uploading resource:", error);
      alert("Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up border border-white/50 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Share Resource</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time Commitment</label>
              <select
                value={timeCommitment}
                onChange={(e) => setTimeCommitment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                disabled={isUploading}
              >
                <option>Quick (&lt; 1 hour)</option>
                <option>Medium (Half-day)</option>
                <option>High (Multi-day project)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Estimate</label>
              <select
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                disabled={isUploading}
              >
                <option>Free (0 MKD)</option>
                <option>Low Cost (Self-funded)</option>
                <option>Grant Required</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                disabled={isUploading}
              >
                <option>Primary School</option>
                <option>High School</option>
                <option>Adults / Community</option>
                <option>Mixed Group</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location (City/Village)</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                disabled={isUploading}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (Press Enter)</label>
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
              placeholder="Add tags (e.g., Camps, English)..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">File</label>
            <div className="relative group">
              <input
                type="file"
                required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer border border-gray-200 rounded-xl p-2"
                onChange={(e) => setFile(e.target.files[0])}
                disabled={isUploading}
              />
            </div>
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
                Uploading...
              </>
            ) : (
              "Upload Resource"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
