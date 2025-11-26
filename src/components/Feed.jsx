import { useState, useEffect, useRef } from 'react';
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

    const [showMap, setShowMap] = useState(false);
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <h1 className="text-4xl font-bold text-gray-900 animate-glow">Мировен Корпус Атлас</h1>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative min-h-screen">
            <div className="flex flex-col gap-6">
                {/* Search Bar */}
                <div className="relative w-full max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search something, find anything"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-full bg-white border border-gray-200 shadow-sm focus:shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-lg placeholder:text-gray-400"
                    />
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl pointer-events-none">search</span>
                </div>

                {/* Categories & Filters */}
                <div className="w-full flex justify-center">
                    <div
                        ref={scrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className="flex flex-col sm:flex-row gap-4 items-center overflow-x-auto pb-4 sm:pb-0 scrollbar-hide max-w-full px-4 cursor-grab active:cursor-grabbing"
                    >

                        {/* Group 1: All & Top */}
                        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-full flex-shrink-0">
                            <button
                                onClick={() => setActiveTag('All')}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTag === 'All'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setSortBy(sortBy === 'top' ? 'newest' : 'top')}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1 ${sortBy === 'top'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                🔥 Top
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-8 bg-gray-200"></div>

                        {/* Group 2: Categories */}
                        <div className="flex gap-2 flex-nowrap">
                            {tags.filter(t => t.name !== 'All').map(tag => {
                                const isActive = activeTag === tag.name;
                                let buttonClass = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';

                                if (isActive) {
                                    buttonClass = `${tag.color} text-white shadow-lg scale-105 border-transparent`;
                                }

                                return (
                                    <button
                                        key={tag.name}
                                        onClick={() => setActiveTag(tag.name)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${buttonClass}`}
                                    >
                                        {tag.emoji}{tag.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid - 2 Columns Max */}
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto">
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

            {/* Map Widget - Resizable & Toggleable */}
            <div className={`fixed bottom-8 right-8 z-40 transition-all duration-500 ease-in-out shadow-2xl rounded-3xl overflow-hidden border-4 border-white ${showMap ? 'w-[90vw] h-[320px] sm:w-[400px] sm:h-[400px] opacity-100 translate-y-0' : 'w-16 h-16 opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="relative w-full h-full">
                    <ResourceMap resources={filteredResources} />
                    <button
                        onClick={() => setShowMap(false)}
                        className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors z-[1000]"
                    >
                        <span className="material-symbols-rounded text-xl">close</span>
                    </button>
                </div>
            </div>

            {/* Floating Map Toggle Button (FAB) */}
            {!showMap && (
                <button
                    onClick={() => setShowMap(true)}
                    className="fixed bottom-8 right-8 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center group"
                >
                    <span className="material-symbols-rounded text-2xl group-hover:animate-pulse">map</span>
                </button>
            )}
        </div>
    );
}
