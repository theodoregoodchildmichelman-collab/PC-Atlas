import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import ResourceMap from './ResourceMap';

export default function Feed({ onResourceClick, viewMode }) {
    const [activeTag, setActiveTag] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'top'
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

    const handleUpvote = async (e, resource) => {
        e.stopPropagation();
        if (!auth.currentUser) return;

        const resourceRef = doc(db, 'resources', resource.id);
        const userId = auth.currentUser.uid;
        const isUpvoted = resource.upvotedBy?.includes(userId);

        try {
            if (isUpvoted) {
                await updateDoc(resourceRef, {
                    upvotes: increment(-1),
                    upvotedBy: arrayRemove(userId)
                });
            } else {
                await updateDoc(resourceRef, {
                    upvotes: increment(1),
                    upvotedBy: arrayUnion(userId)
                });
            }
        } catch (error) {
            console.error("Error updating upvote:", error);
        }
    };

    const handleQuickDownload = (e, resource) => {
        e.stopPropagation();
        if (resource.fileUrl) {
            window.open(resource.fileUrl, '_blank');
        }
    };

    // Filter and Sort
    let filteredResources = activeTag === 'All'
        ? resources
        : resources.filter(r => r.tags.includes(activeTag));

    if (sortBy === 'top') {
        filteredResources = [...filteredResources].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
        // Default is newest (already sorted by query, but good to ensure)
        filteredResources = [...filteredResources].sort((a, b) => b.createdAt - a.createdAt);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <h1 className="text-4xl font-bold text-gray-900 animate-glow">Мировен Корпус Атлас</h1>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tag Filter */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide w-full sm:w-auto">
                    <div className="flex gap-3 items-center">
                        {tags.map(tag => {
                            let emoji = '';
                            let colorClass = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';

                            if (tag === 'Camps') emoji = '⛺ ';
                            if (tag === 'Clubs') emoji = '♟️ ';

                            if (activeTag === tag) {
                                if (tag === 'EE Lesson Plans') colorClass = 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-105 border-transparent';
                                else if (tag === 'CD Resources') colorClass = 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-transparent';
                                else colorClass = 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 border-transparent';
                            }

                            return (
                                <button
                                    key={tag}
                                    onClick={() => setActiveTag(tag)}
                                    className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition-all duration-300 ${colorClass}`}
                                >
                                    {emoji}{tag}
                                </button>
                            );
                        })}

                        {/* Top Filter */}
                        <div className="w-px h-8 bg-gray-200 mx-2"></div>
                        <button
                            onClick={() => setSortBy(sortBy === 'top' ? 'newest' : 'top')}
                            className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${sortBy === 'top'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            🔥 Top
                        </button>
                    </div>
                </div>
            </div>

            {/* Content - Always show grid, overlay map if viewMode is map */}
            {/* Widen cards: using grid-cols-1 sm:grid-cols-2 (removed lg:grid-cols-3 to make them wider on large screens) */}
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
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
                            className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Like Button - Top Right (Redesigned) */}
                            <button
                                onClick={(e) => handleLike(e, resource)}
                                className="absolute top-6 right-6 p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border border-gray-100 transition-all z-10 group-hover:scale-110 active:scale-95 flex items-center justify-center w-10 h-10"
                            >
                                <span className="text-xl leading-none">
                                    {resource.likedBy?.includes(auth.currentUser?.uid) ? '❤️' : '🤍'}
                                </span>
                                {resource.likes > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                                        {resource.likes}
                                    </span>
                                )}
                            </button>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-2 mb-3">
                                    {resource.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{resource.date}</span>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors pr-12">
                                {resource.title}
                            </h3>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {resource.timeCommitment && (
                                    <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <span className="font-bold underline decoration-indigo-300 decoration-2 underline-offset-2">Schedule</span>: {resource.timeCommitment.split(' ')[0]}
                                    </span>
                                )}
                                {resource.cost && (
                                    <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <span className="font-bold underline decoration-emerald-300 decoration-2 underline-offset-2">Savings</span>: {resource.cost.split(' ')[0]}
                                    </span>
                                )}
                                {resource.audience && (
                                    <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <span className="font-bold underline decoration-blue-300 decoration-2 underline-offset-2">Group</span>: {resource.audience}
                                    </span>
                                )}
                            </div>

                            <p className="text-base text-gray-500 mb-16 line-clamp-3 leading-relaxed">
                                {resource.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-6 mt-auto absolute bottom-8 left-8 right-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                                        {resource.authorName ? resource.authorName[0] : 'A'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{resource.authorName || 'Anonymous'}</span>
                                        {resource.location && (
                                            <span className="text-xs text-gray-500">
                                                City: {resource.location}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Upvote Button (Orange 👍) */}
                                    <button
                                        onClick={(e) => handleUpvote(e, resource)}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${resource.upvotedBy?.includes(auth.currentUser?.uid)
                                                ? 'bg-orange-200 text-orange-700 shadow-inner'
                                                : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                                            }`}
                                        title="Upvote"
                                    >
                                        <span className="text-lg leading-none">👍</span>
                                        {resource.upvotes > 0 && (
                                            <span className="ml-1 text-xs font-bold">{resource.upvotes}</span>
                                        )}
                                    </button>

                                    {/* Download Button */}
                                    <button
                                        onClick={(e) => handleQuickDownload(e, resource)}
                                        className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    >
                                        Download
                                    </button>
                                </div>
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
