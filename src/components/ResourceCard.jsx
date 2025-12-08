import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';

export default function ResourceCard({ resource, onClick, onLike, onUpvote, onDownload, onEdit, onDelete, userName }) {
    const { currentUser } = useAuth(); // Use the useAuth hook to get the current user
    // Local state for heart to ensure instant feedback and privacy
    const [isLiked, setIsLiked] = useState(resource.likedBy?.includes(currentUser?.uid) || false);
    const [isDownloading, setIsDownloading] = useState(false); // Added for download button

    const handleHeartClick = (e) => {
        e.stopPropagation();
        setIsLiked(!isLiked); // Instant toggle
        onLike(e, resource); // Persist
    };

    return (
        <div
            className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative h-full flex flex-col overflow-hidden"
        >
            {/* Clickable Body Area */}
            <div
                onClick={() => onClick(resource)}
                className="p-8 pb-4 flex-grow cursor-pointer"
            >


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

                <p className="text-base text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                    {resource.description}
                </p>
            </div>

            {/* Non-Clickable Footer Area (Action Bar) */}
            <div className="px-8 pb-8 pt-4 mt-auto border-t border-gray-50 flex items-center justify-between bg-white z-50 relative cursor-default">
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
                    {/* Like Button (Heart) - Now in footer */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleHeartClick(e);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Like"
                    >
                        <span className="text-xl leading-none grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all">
                            {isLiked ? '❤️' : '🤍'}
                        </span>
                    </button>

                    {/* Edit/Delete for Owner */}
                    {userName && resource.authorName === userName && (
                        <div className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                                className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Edit"
                            >
                                <span className="material-symbols-rounded text-lg">edit</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
                                className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <span className="material-symbols-rounded text-lg">delete</span>
                            </button>
                        </div>
                    )}

                    {/* Upvote Button (Orange 👍) */}
                    <button
                        onClick={(e) => onUpvote(e, resource)}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${resource.upvotedBy?.includes(currentUser?.uid)
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
                    {(resource.fileURL || resource.fileUrl) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDownloading(true);
                                onDownload(e, resource).finally(() => setIsDownloading(false));
                            }}
                            disabled={isDownloading}
                            className={`px-4 py-2 rounded-full text-white text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer ${isDownloading ? 'bg-gray-400 cursor-wait' : 'bg-gray-900 hover:bg-gray-800'} shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 relative z-50`}
                        >
                            {isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
