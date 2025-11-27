import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function DetailModal({ resource, onClose, userName }) {
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!resource?.id) return;

        const q = query(
            collection(db, 'resources', resource.id, 'comments'),
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
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'resources', resource.id, 'comments'), {
                text: comment,
                createdAt: serverTimestamp(),
                userId: auth.currentUser?.uid,
                authorName: userName || 'Anonymous'
            });
            setComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: resource.title,
                    text: resource.description,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    const handlePrint = () => {
        window.print();
    };

    const [showComments, setShowComments] = useState(false);

    if (!resource) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:bg-white print:p-0 print:static">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative print:shadow-none print:max-h-full print:w-full flex flex-col">

                {/* Header Image - Dynamic Height */}
                <div className="min-h-[200px] h-auto py-8 bg-gradient-to-r from-indigo-500 to-purple-600 relative print:hidden flex-shrink-0 flex items-center justify-center">
                    <div className="text-center px-8 w-full">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md leading-tight">{resource.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all backdrop-blur-md"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Column: Resource Details */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:border-r border-gray-100 print:p-0">
                        {/* Title for Print */}
                        <h1 className="hidden print:block text-3xl font-bold mb-4">{resource.title}</h1>

                        {/* Download Button - Prioritized */}
                        {resource.fileUrl && (
                            <button
                                onClick={handleDownload}
                                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-8 print:hidden text-lg sm:text-xl"
                            >
                                <span className="material-symbols-rounded text-2xl sm:text-3xl">download</span>
                                Download
                            </button>
                        )}

                        <div className="flex flex-col gap-3 mb-8 text-base sm:text-lg">
                            {resource.timeCommitment && (
                                <div className="text-gray-700">
                                    <span className="font-bold text-black">Schedule:</span> {resource.timeCommitment}
                                </div>
                            )}
                            {resource.cost && (
                                <div className="text-gray-700">
                                    <span className="font-bold text-black">Cost:</span> {resource.cost}
                                </div>
                            )}
                            {resource.audience && (
                                <div className="text-gray-700">
                                    <span className="font-bold text-black">Group:</span> {resource.audience}
                                </div>
                            )}
                            {resource.location && (
                                <div className="text-gray-700">
                                    <span className="font-bold text-black">Location:</span> {resource.location}
                                </div>
                            )}
                        </div>

                        <div className="prose prose-indigo max-w-none text-gray-600 mb-8">
                            <p className="whitespace-pre-wrap leading-relaxed">{resource.description}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2 mb-8">
                            {resource.tags && resource.tags.map(tag => (
                                <span key={tag} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Forum Sidebar (Collapsible on Mobile) */}
                    <div className="w-full lg:w-96 bg-gray-50 flex flex-col border-l border-gray-100 print:hidden flex-shrink-0">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex justify-between items-center w-full lg:cursor-default"
                        >
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-rounded text-indigo-600">forum</span>
                                Forum
                                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
                            </h3>
                            <span className="material-symbols-rounded lg:hidden text-gray-500 transition-transform duration-300" style={{ transform: showComments ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                expand_more
                            </span>
                        </button>

                        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${showComments ? 'h-[400px] opacity-100' : 'h-0 opacity-0 lg:h-auto lg:opacity-100'}`}>
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
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !comment.trim()}
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
        </div>
    );
}
