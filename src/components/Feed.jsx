import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import ResourceMap from './ResourceMap';
import ResourceCard from './ResourceCard';

export default function Feed({ onResourceClick, viewMode, userName, onEdit }) {
    const [activeTag, setActiveTag] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'top'
    const [searchQuery, setSearchQuery] = useState('');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    const tags = [
        { name: 'All', color: 'bg-blue-600', emoji: '' },
        { name: 'EE Lesson Plans', color: 'bg-green-600', emoji: '📖 ' },
        { name: 'Camps', color: 'bg-yellow-500', emoji: '⛺ ' },
        { name: 'Clubs', color: 'bg-indigo-600', emoji: '♟️ ' },
        { name: 'CD Resources', color: 'bg-red-600', emoji: '🏙️ ' }
    ];

    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resourcesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString() || 'Just now'
            }));
            setResources(resourcesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLike = async (e, resource) => {
        e.stopPropagation();
        if (!auth.currentUser) return;

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

    const handleDelete = async (resource) => {
        if (window.confirm("Are you sure you want to delete this resource? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'resources', resource.id));
            } catch (error) {
                console.error("Error deleting resource:", error);
                alert("Failed to delete resource.");
            }
        }
    };

    const handleQuickDownload = (e, resource) => {
        e.stopPropagation();
        if (resource.fileUrl) {
            window.open(resource.fileUrl, '_blank');
        }
    };

    // Smart Search Logic
    const getSmartFilters = (query) => {
        const lowerQuery = query.toLowerCase();
        const filters = {
            cost: [],
            time: [],
            audience: []
        };

        // Cost Synonyms
        if (['cheap', 'free', 'budget', 'no cost', '0 mkd'].some(k => lowerQuery.includes(k))) {
            filters.cost.push('Free (0 MKD)', 'Low Cost');
        }

        // Time Synonyms
        if (['quick', 'short', 'fast', 'brief', 'hour'].some(k => lowerQuery.includes(k))) {
            filters.time.push('Quick (< 1 hour)');
        }

        // Audience Synonyms
        if (['kids', 'children', 'primary', 'young'].some(k => lowerQuery.includes(k))) {
            filters.audience.push('Primary School');
        }
        if (['adults', 'grownups', 'parents', 'community'].some(k => lowerQuery.includes(k))) {
            filters.audience.push('Adults');
        }
        if (['high school', 'teens', 'youth'].some(k => lowerQuery.includes(k))) {
            filters.audience.push('High School');
        }

        return filters;
    };

    // Filter and Sort Logic
    let filteredResources = resources;

    // 1. Tag Filter
    if (activeTag !== 'All') {
        filteredResources = filteredResources.filter(r => r.tags.includes(activeTag));
    }

    // 2. Smart Search
    if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        const smartFilters = getSmartFilters(lowerQuery);

        filteredResources = filteredResources.filter(r => {
            // Standard Text Match
            const textMatch =
                r.title.toLowerCase().includes(lowerQuery) ||
                r.description.toLowerCase().includes(lowerQuery) ||
                r.location?.toLowerCase().includes(lowerQuery);

            // Smart Filter Match
            const costMatch = smartFilters.cost.length > 0 && smartFilters.cost.includes(r.cost);
            const timeMatch = smartFilters.time.length > 0 && smartFilters.time.includes(r.timeCommitment);
            const audienceMatch = smartFilters.audience.length > 0 && smartFilters.audience.includes(r.audience);

            return textMatch || costMatch || timeMatch || audienceMatch;
        });
    }

    // 3. Sorting
    if (sortBy === 'top') {
        filteredResources = [...filteredResources].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
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
            <div className="flex flex-col gap-6">
                {/* Search Bar */}
                <div className="relative w-full max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search resources (e.g., 'quick english lesson', 'free camps')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-full bg-white border border-gray-200 shadow-sm focus:shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-lg"
                    />
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">search</span>
                </div>

                {/* Tag Filter */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide w-full flex justify-center">
                    <div className="flex gap-3 items-center">
                        {tags.map(tag => {
                            const isActive = activeTag === tag.name;
                            // Default inactive style
                            let buttonClass = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';

                            if (isActive) {
                                // Active style based on color
                                buttonClass = `${tag.color} text-white shadow-lg scale-105 border-transparent`;
                            }

                            return (
                                <button
                                    key={tag.name}
                                    onClick={() => setActiveTag(tag.name)}
                                    className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition-all duration-300 ${buttonClass}`}
                                >
                                    {tag.emoji}{tag.name}
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

            {/* Content */}
            {viewMode === 'map' ? (
                <ResourceMap resources={filteredResources} onResourceClick={onResourceClick} />
            ) : (
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResources.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p className="text-lg">No resources found for "{searchQuery || activeTag}".</p>
                            <p className="text-sm mt-2">Try adjusting your search or be the first to share something!</p>
                        </div>
                    ) : (
                        filteredResources.map((resource, index) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                onClick={onResourceClick}
                                onLike={handleLike}
                                onUpvote={handleUpvote}
                                onDownload={handleQuickDownload}
                                index={index}
                                userName={userName}
                                onEdit={onEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
