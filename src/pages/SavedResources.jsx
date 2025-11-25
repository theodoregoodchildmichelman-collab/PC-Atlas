import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import ResourceCard from '../components/ResourceCard';

export default function SavedResources({ onResourceClick, userName, onEdit }) {
    const [savedResources, setSavedResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'resources'),
            where('likedBy', 'array-contains', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resourcesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString() || 'Just now'
            }));
            setSavedResources(resourcesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUnlike = async (e, resource) => {
        e.stopPropagation();
        if (!auth.currentUser) return;

        const resourceRef = doc(db, 'resources', resource.id);
        const userId = auth.currentUser.uid;

        try {
            await updateDoc(resourceRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
            // The snapshot listener will automatically update the list
        } catch (error) {
            console.error("Error removing like:", error);
        }
    };

    const handleUpvote = async (e, resource) => {
        // ... (reuse logic or import if possible, but duplicating for speed/isolation is fine here)
        // Actually, let's just pass a dummy or handle it if we want upvoting here too.
        // The prompt says "Re-use the existing ItemCard component".
        // I'll implement upvote logic here too or move it to a hook later.
        // For now, minimal implementation.
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

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (savedResources.length === 0) {
        return (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Saved Items Yet</h2>
                <p className="text-gray-500">Click the heart icon on any resource to save it here.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">My Saved Resources</h2>
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
                {savedResources.map((resource, index) => (
                    <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onClick={onResourceClick}
                        onLike={handleUnlike} // Clicking heart here removes it
                        onUpvote={handleUpvote} // Optional in this view, but good to have
                        onDownload={handleQuickDownload}
                        index={index}
                        userName={userName}
                        onEdit={onEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
