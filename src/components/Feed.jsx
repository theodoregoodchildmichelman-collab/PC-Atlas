import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import ResourceMap from './ResourceMap';
import ResourceCard from './ResourceCard';
import FilterSidebar from './FilterSidebar';

export default function Feed({ onResourceClick, viewMode, userName, onEdit }) {
    const [activeTag, setActiveTag] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'top'
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    // Advanced Filters State
    const [filters, setFilters] = useState({
        cost: [],
        time: [],
        group: [],
        location: ''
    });

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
        // ... (same as before)
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
        // ... (existing code)
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
                // Snapshot listener will update UI
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

    const handleFilterChange = (category, value) => {
        setFilters(prev => ({
            ...prev,
            [category]: value
        }));
    };

    // Extract unique locations
    const uniqueLocations = [...new Set(resources.map(r => r.location).filter(Boolean))].sort();

    // Filter and Sort Logic
    let filteredResources = resources;

    // 1. Tag Filter
    if (activeTag !== 'All') {
        filteredResources = filteredResources.filter(r => r.tags.includes(activeTag));
    }

    // 2. Advanced Filters (AND across categories, OR within)
    if (filters.cost.length > 0) {
        filteredResources = filteredResources.filter(r => filters.cost.includes(r.cost));
    }
    if (filters.time.length > 0) {
        filteredResources = filteredResources.filter(r => filters.time.includes(r.timeCommitment));
    }
    if (filters.group.length > 0) {
        filteredResources = filteredResources.filter(r => filters.group.includes(r.audience));
    }
    if (filters.location) {
        filteredResources = filteredResources.filter(r => r.location === filters.location);
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

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar - Hidden on mobile, or could be collapsible (keeping simple for now as requested "Sidebar (desktop)") */}
                <div className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        locations={uniqueLocations}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
                        {filteredResources.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <p className="text-lg">No resources found for "{activeTag}" with current filters.</p>
                                <p className="text-sm mt-2">Try adjusting your filters or be the first to share something!</p>
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
                </div>
            </div>
        </div>
    );
}
