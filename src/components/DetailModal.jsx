import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function DetailModal({ resource, onClose }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!resource?.id) return;

        const q = query(
            collection(db, `resources/${resource.id}/comments`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString() || 'Just now'
            }));
            setComments(commentsData);
        });

        return () => unsubscribe();
    }, [resource?.id]);

    const handleDownload = () => {
        if (resource.fileUrl) {
            window.open(resource.fileUrl, '_blank');
            // TODO: Increment download count in Firestore
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, `resources/${resource.id}/comments`), {
                text: newComment,
                authorName: auth.currentUser ? 'Volunteer' : 'Anonymous',
                userId: auth.currentUser ? auth.currentUser.uid : 'anon',
                createdAt: serverTimestamp()
            });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!resource) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-5xl h-[90vh] sm:h-[85vh] sm:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl animate-slide-up border border-white/50 overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start flex-shrink-0 bg-gray-50/50 backdrop-blur-md z-10">
                    <div className="pr-8">
                        <h2 className="text-2xl font-bold text-gray-900 line-clamp-2 leading-tight tracking-tight">{resource.title}</h2>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Author</span>
                            {resource.authorName || 'Anonymous'}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Column: Resource Details */}
                    <div className="flex-1 overflow-y-auto p-8 lg:border-r border-gray-100">
                        <div className="mb-10">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                            <p className="text-gray-700 leading-loose text-lg whitespace-pre-wrap">{resource.description}</p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {resource.tags.map(tag => (
                                    <span key={tag} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {resource.timeCommitment && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <span className="material-symbols-rounded text-indigo-500">schedule</span>
                                        <span className="font-medium">Time:</span> {resource.timeCommitment}
                                    </div>
                                )}
                                {resource.cost && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <span className="material-symbols-rounded text-emerald-500">savings</span>
                                        <span className="font-medium">Cost:</span> {resource.cost}
                                    </div>
                                )}
                                {resource.audience && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <span className="material-symbols-rounded text-blue-500">group</span>
                                        <span className="font-medium">Audience:</span> {resource.audience}
                                    </div>
                                )}
                                {resource.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        {resource.location}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* File Preview Removed */}

                        <button
                            onClick={handleDownload}
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 text-lg"
                        >
                            <span className="material-symbols-rounded">download</span>
                            Download
                        </button>
                    </div>

                    {/* Right Column: Forum Sidebar */}
                    <div className="w-full lg:w-96 bg-gray-50 flex flex-col border-l border-gray-100">
                        <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-rounded text-indigo-600">forum</span>
                                Forum
                                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {comments.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <span className="material-symbols-rounded text-4xl mb-2 opacity-50">chat_bubble_outline</span>
                                    <p className="text-sm italic">Start the discussion!</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 animate-fade-in group">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0 mt-1">
                                            {comment.authorName ? comment.authorName[0] : 'A'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="text-xs font-bold text-gray-900">{comment.authorName}</span>
                                                    <span className="text-[10px] text-gray-400">{comment.date}</span>
                                                </div>
                                                <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={handleSubmitComment} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all outline-none bg-gray-50 focus:bg-white"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newComment.trim()}
                                    className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    <span className="material-symbols-rounded text-xl">send</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
