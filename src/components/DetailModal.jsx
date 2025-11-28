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

    if (!resource) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:bg-white print:p-0 print:static">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative print:shadow-none print:max-h-full print:w-full flex flex-col">

                {/* Header Image - Narrower Width */}
                <div className="min-h-[150px] h-auto py-6 bg-gradient-to-r from-indigo-500 to-purple-600 relative print:hidden flex-shrink-0 flex items-center justify-center w-full md:max-w-sm mx-auto md:rounded-b-3xl">
                    <div className="text-center px-8 w-full">
                        <h2 className="text-xl sm:text-3xl font-bold text-white drop-shadow-md leading-tight">{resource.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all backdrop-blur-md"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Resource Details - Full Width */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0">
                        {/* Title for Print */}
                        <h1 className="hidden print:block text-3xl font-bold mb-4">{resource.title}</h1>

                        {/* Download Button - Prioritized */}
                        {resource.fileUrl && (
                            <div className="flex justify-center mb-8">
                                <button
                                    onClick={handleDownload}
                                    className="w-full sm:w-auto min-w-[200px] bg-atlas-blue text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-indigo-500/30 hover:bg-opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center text-lg sm:text-xl"
                                >
                                    Download
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-6 mb-8 text-base sm:text-lg justify-center">
                            {resource.timeCommitment && (
                                <div className="text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">
                                    <span className="font-bold text-atlas-navy">Schedule:</span> {resource.timeCommitment}
                                </div>
                            )}
                            {resource.cost && (
                                <div className="text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">
                                    <span className="font-bold text-atlas-navy">Cost:</span> {resource.cost}
                                </div>
                            )}
                            {resource.audience && (
                                <div className="text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">
                                    <span className="font-bold text-atlas-navy">Group:</span> {resource.audience}
                                </div>
                            )}
                            {resource.location && (
                                <div className="text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">
                                    <span className="font-bold text-atlas-navy">Location:</span> {resource.location}
                                </div>
                            )}
                        </div>

                        <div className="prose prose-indigo max-w-3xl mx-auto text-gray-600 mb-8">
                            <p className="whitespace-pre-wrap leading-relaxed">{resource.description}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2 mb-12 justify-center">
                            {resource.tags && resource.tags.map(tag => (
                                <span key={tag} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Comments Section - Beneath Post */}
                        <div className="max-w-3xl mx-auto border-t border-gray-100 pt-12">
                            <h3 className="text-2xl font-bold text-atlas-navy mb-8 flex items-center gap-2">
                                <span className="material-symbols-rounded text-atlas-blue">forum</span>
                                Discussion
                                <span className="bg-gray-100 text-gray-500 text-sm px-2 py-1 rounded-full">{comments.length}</span>
                            </h3>

                            {/* Comment Input */}
                            <form onSubmit={handleSubmitComment} className="mb-10 bg-gray-50 p-6 rounded-3xl">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-atlas-blue flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                                        {userName ? userName[0] : 'A'}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            placeholder="Share your thoughts or ask a question..."
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-atlas-blue focus:ring-2 focus:ring-indigo-500/10 text-base transition-all outline-none bg-white min-h-[100px] resize-y"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <div className="flex justify-end mt-3">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !comment.trim()}
                                                className="px-6 py-2 bg-atlas-blue text-white rounded-full font-bold hover:bg-opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                Post Comment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-6">
                                {comments.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        <span className="material-symbols-rounded text-4xl mb-2 opacity-50">chat_bubble_outline</span>
                                        <p className="text-base">No comments yet. Be the first to start the discussion!</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="flex gap-4 animate-fade-in group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                                                {comment.authorName ? comment.authorName[0] : 'A'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-gray-50 p-4 rounded-3xl rounded-tl-none hover:bg-gray-100 transition-colors">
                                                    <div className="flex justify-between items-baseline mb-2">
                                                        <span className="font-bold text-atlas-navy">{comment.authorName}</span>
                                                        <span className="text-xs text-gray-400">{comment.date}</span>
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
