import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import ResourceMap from './ResourceMap';

export default function Feed({ onResourceClick, viewMode }) {
    const [activeTag, setActiveTag] = useState('All');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    const tags = ['All', 'Camps', 'Clubs', 'EE Lesson Plans', 'CD Resources'];

    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resourcesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Timestamp to date string
                date: doc.data().createdAt?.toDate().toLocaleDateString() || 'Just now'
            }));
            setResources(resourcesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLike = async (e, resource) => {
        e.stopPropagation(); // Prevent opening modal
        if (!auth.currentUser) return; // Or show login prompt

        const resourceRef = doc(db, 'resources', resource.id);
        const userId = auth.currentUser.uid;
        const isLiked = resource.likedBy?.includes(userId);

        try {
            if (isLiked) {
                await updateDoc(resourceRef, {
                    likes: increment(-1),
                    likedBy: arrayRemove(userId)
                });
            } else {
                await updateDoc(resourceRef, {
                    likes: increment(1),
                    likedBy: arrayUnion(userId)
                });
            }
        } catch (error) {
            console.error("Error updating like:", error);
        }
    };

    const filteredResources = activeTag === 'All'
        ? resources
        : resources.filter(r => r.tags.includes(activeTag));

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="material-symbols-rounded animate-spin text-4xl text-indigo-600">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tag Filter */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide w-full sm:w-auto">
                    <div className="flex gap-3">
                        {tags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition-all duration-300 ${activeTag === tag
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content - Always show grid, overlay map if viewMode is map */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResources.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p className="text-lg">No resources found for "{activeTag}".</p>
                        <p className="text-sm mt-2">Be the first to share something!</p>
                    </div>
                ) : (
                    filteredResources.map((resource, index) => (
                        <div
                            key={resource.id}
                            onClick={() => onResourceClick(resource)}
                            className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Like Button - Top Left */}
                            <button
                                onClick={(e) => handleLike(e, resource)}
                                className="absolute top-4 left-4 p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border border-gray-100 transition-all z-10 group-hover:scale-110 active:scale-95"
                            >
                                <span className={`material-symbols-rounded text-base ${resource.likedBy?.includes(auth.currentUser?.uid) ? 'text-red-500' : 'text-red-400'}`} style={{ fontVariationSettings: resource.likedBy?.includes(auth.currentUser?.uid) ? "'FILL' 1" : "'FILL' 0" }}>
                                    favorite
                                </span>
                                {resource.likes > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-sm">
                                        {resource.likes}
                                    </span>
                                )}
                            </button>

                            <div className="flex justify-between items-start mb-3 pl-10">
                                <div className="flex gap-2 mb-3">
                                    {resource.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{resource.date}</span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {resource.title}
                            </h3>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {resource.timeCommitment && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        📝 Schedule: {resource.timeCommitment.split(' ')[0]}
                                    </span>
                                )}
                                {resource.cost && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                        💰 Savings: {resource.cost.split(' ')[0]}
                                    </span>
                                )}
                                {resource.audience && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                        Group: {resource.audience}
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                                {resource.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 border-t border-gray-50 pt-4 mt-auto">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-[10px]">
                                    {resource.authorName ? resource.authorName[0] : 'A'}
                                </div>
                                <span>{resource.authorName || 'Anonymous'}</span>
                                {resource.location && (
                                    <span className="ml-auto flex items-center gap-1">
                                        City: {resource.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Map Widget */}
            {viewMode === 'map' && (
                <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm h-80 shadow-2xl rounded-3xl overflow-hidden border-2 border-white animate-slide-up">
                    <ResourceMap resources={filteredResources} onResourceClick={onResourceClick} />
                </div>
            )}
        </div>
    );
}
