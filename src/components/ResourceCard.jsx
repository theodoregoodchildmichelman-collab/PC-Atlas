import React, { useState } from 'react';
import { auth } from '../firebase';

export default function ResourceCard({ resource, onClick, onLike, onUpvote, onDownload, index, userName, onEdit, onDelete }) {
    // Local state for heart to ensure instant feedback and privacy
    const [isLiked, setIsLiked] = useState(resource.likedBy?.includes(auth.currentUser?.uid) || false);

    const handleHeartClick = (e) => {
        e.stopPropagation();
        setIsLiked(!isLiked); // Instant toggle
        onLike(e, resource); // Persist
    };

    return (
        <div
            onClick={() => onClick(resource)}
            className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative h-full flex flex-col"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Title Section */}
            <div className="mb-2">
                <h3 className="text-2xl font-bold text-atlas-navy mb-2 line-clamp-2 group-hover:text-atlas-blue transition-colors">
                    {resource.title}
                </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed flex-grow">
                {resource.description}
            </p>

            {/* Primary Action: Download */}
            <button
                onClick={(e) => onDownload(e, resource)}
                className="w-full py-3 rounded-full bg-atlas-blue text-white text-sm font-bold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg mb-6"
            >
                Download
            </button>

            {/* Secondary Actions Row - Clean Icon Suite Style */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                <div className="flex items-center gap-4">
                    {/* Like (Heart) */}
                    <button
                        onClick={handleHeartClick}
                        className="flex flex-col items-center gap-1 group/btn"
                    >
                        <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <span className={`text-xl leading-none transition-all ${isLiked ? 'grayscale-0' : 'grayscale opacity-60 group-hover/btn:opacity-100 group-hover/btn:grayscale-0'}`}>
                                {isLiked ? '❤️' : '🤍'}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400">Heart</span>
                    </button>

                    {/* Share */}
                    <button
                        onClick={(e) => { e.stopPropagation(); /* Add share logic if needed */ }}
                        className="flex flex-col items-center gap-1 group/btn"
                    >
                        <div className="p-2 rounded-full hover:bg-gray-50 transition-colors">
                            <span className="material-symbols-rounded text-xl text-atlas-blue opacity-80 group-hover/btn:opacity-100">share</span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400">Share</span>
                    </button>
                </div>

                {/* View Details */}
                <span className="text-xs font-bold text-atlas-navy hover:text-atlas-blue transition-colors">
                    View Details
                </span>

                {/* Upvote */}
                <button
                    onClick={(e) => onUpvote(e, resource)}
                    className="flex flex-col items-center gap-1 group/btn"
                >
                    <div className={`p-2 rounded-full transition-colors ${resource.upvotedBy?.includes(auth.currentUser?.uid) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                        <span className={`material-symbols-rounded text-xl transition-all ${resource.upvotedBy?.includes(auth.currentUser?.uid) ? 'text-atlas-orange' : 'text-atlas-orange opacity-60 group-hover/btn:opacity-100'}`}>arrow_upward</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400">Upvote</span>
                </button>
            </div>

            {/* Admin Controls (Absolute) */}
            {userName && resource.authorName === userName && (
                <div className="absolute top-4 right-4 flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                        className="p-1.5 rounded-full text-gray-300 hover:text-atlas-blue hover:bg-blue-50 transition-colors"
                        title="Edit"
                    >
                        <span className="material-symbols-rounded text-base">edit</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
                        className="p-1.5 rounded-full text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                    >
                        <span className="material-symbols-rounded text-base">delete</span>
                    </button>
                </div>
            )}
        </div>
    );
}
