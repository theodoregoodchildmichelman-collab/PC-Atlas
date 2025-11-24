import { Store } from './store.js';
import { Utils } from './utils.js';

/**
 * ==========================================
 * MODULE: COMPONENT RENDERERS
 * ==========================================
 */
export const Components = {
    Navbar: () => `
    <nav class="sticky top-0 z-40 w-full glass border-b border-apple-border/50">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-apple-blue text-3xl">volunteer_activism</span>
                <h1 class="text-xl font-semibold tracking-tight">Riznica</h1>
            </div>
            <div class="flex items-center gap-4">
                <button onclick="window.Actions.openUploadModal()" class="bg-apple-text text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition-colors shadow-card flex items-center gap-2">
                    <span class="material-symbols-rounded text-lg">add</span>
                    Share Resource
                </button>
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-300">PC</div>
            </div>
        </div>
    </nav>
    `,

    Hero: () => `
    <header class="max-w-6xl mx-auto px-4 py-12 md:py-20 text-center">
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-apple-text">
            Share Knowledge: <span class="text-apple-blue">Volunteer to Volunteer</span>
        </h2>
        <p class="text-lg text-apple-subtext max-w-2xl mx-auto mb-8">
            A centralized repository of educational best practices, camp itineraries, and club guides.
        </p>

        <div class="max-w-xl mx-auto relative group">
            <span class="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input type="text"
                placeholder="Search for 'English games' or 'Leadership'..."
                class="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-transparent shadow-soft focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-base"
                oninput="window.Actions.handleSearch(this.value)"
                value="${Store.searchQuery}"
            >
        </div>

        <div class="flex flex-wrap justify-center gap-2 mt-8" id="filter-container">
            ${['All', 'Camps', 'Clubs', 'E.E Lesson Plans', 'CD Resources'].map(cat => `
                <button 
                    onclick="window.Actions.setCategory('${cat}')"
                    class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${Store.activeCategory === cat ? 'bg-apple-text text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}"
                >
                    ${cat}
                </button>
            `).join('')}
        </div>
    </header>
    `,

    ResourceCard: (r) => {
        const tagsHtml = r.tags && r.tags.length > 0 
            ? `<div class="flex flex-wrap gap-1 mb-3">
                ${r.tags.map(tag => `<span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wide rounded-md">${tag}</span>`).join('')}
               </div>`
            : '';

        return `
        <div class="bg-white rounded-2xl p-6 shadow-card hover:shadow-soft transition-all duration-300 group cursor-pointer border border-transparent hover:border-apple-blue/10 flex flex-col h-full" onclick="window.Actions.openDetail('${r.id}')">
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wide truncate max-w-[150px]">${r.category}</span>
                <div class="flex items-center text-gray-400 gap-1 text-xs flex-shrink-0">
                    <span class="material-symbols-rounded text-sm">download</span> ${r.downloads || 0}
                </div>
            </div>
            <h3 class="text-lg font-bold mb-2 group-hover:text-apple-blue transition-colors">${r.title}</h3>
            
            ${tagsHtml}
            
            <p class="text-apple-subtext text-sm line-clamp-2 mb-6 flex-grow">${r.description}</p>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                        ${(r.author || "V").charAt(0)}
                    </div>
                    <span class="text-xs text-gray-500 font-medium truncate max-w-[100px]">${r.author || "Volunteer"}</span>
                </div>
                <span class="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">${r.type} • ${r.size}</span>
            </div>
        </div>
        `;
    },

    ResourceGrid: () => {
        if (Store.loading) {
            return `
            <div class="text-center py-20 col-span-full flex flex-col items-center justify-center gap-4">
                <div class="w-8 h-8 border-4 border-apple-blue border-t-transparent rounded-full spin"></div>
                <p class="text-gray-500 animate-pulse">Loading repository...</p>
            </div>
            `;
        }

        const resources = Store.getFilteredResources();
        if (resources.length === 0) {
            return `
            <div class="text-center py-20 col-span-full fade-in">
                <span class="material-symbols-rounded text-6xl text-gray-200 mb-4">folder_off</span>
                <p class="text-gray-500">No resources found.</p>
            </div>
            `;
        }
        return `
        <main class="max-w-6xl mx-auto px-4 pb-20 w-full">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
                ${resources.map(r => Components.ResourceCard(r)).join('')}
            </div>
        </main>
        `;
    },

    CommentThread: (comments, parentId = null) => {
        if (!comments || comments.length === 0) return '';
        
        return `
        <div class="flex flex-col gap-4 ${parentId ? 'ml-8 pl-4 border-l-2 border-gray-100 mt-4' : ''}">
            ${comments.map(c => `
                <div class="group">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold text-sm text-gray-900">${c.author}</span>
                            <span class="text-xs text-gray-400">• ${Utils.timeAgo(c.timestamp)}</span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-2 leading-relaxed">${c.text}</p>
                    <button onclick="window.Actions.toggleReplyForm('${c.id}')" class="text-xs text-apple-blue font-medium hover:underline flex items-center gap-1">
                        Reply
                    </button>

                    <div id="reply-form-${c.id}" class="hidden mt-3 fade-in">
                        <textarea id="reply-input-${c.id}" class="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue resize-none" rows="2" placeholder="Write a reply..."></textarea>
                        <div class="flex justify-end gap-2 mt-2">
                            <button onclick="window.Actions.toggleReplyForm('${c.id}')" class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onclick="window.Actions.submitComment(null, '${c.id}')" class="px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg">Reply</button>
                        </div>
                    </div>

                    ${Components.CommentThread(c.replies, c.id)}
                </div>
            `).join('')}
        </div>
        `;
    },

    DetailModal: (resource) => {
        const comments = resource.comments || [];
        return `
        <div id="modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/20 backdrop-blur-md fade-in" onclick="if(event.target === this) window.Actions.closeModal()">
            <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row slide-up">
                
                <div class="w-full md:w-2/5 bg-gray-50 p-8 border-r border-gray-100 flex flex-col">
                    <div class="mb-6">
                        <span class="text-xs font-bold text-apple-blue bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">${resource.category}</span>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-4 leading-tight">${resource.title}</h2>
                    <p class="text-gray-600 mb-8 leading-relaxed">${resource.description}</p>
                    
                    <div class="flex flex-wrap gap-2 mb-8">
                        ${resource.tags ? resource.tags.map(tag => `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">#${tag}</span>`).join('') : ''}
                    </div>

                    <div class="mt-auto space-y-4">
                        <div class="flex items-center justify-between text-sm text-gray-500 py-2 border-b border-gray-200">
                            <span>Author</span>
                            <span class="font-medium text-gray-900">${resource.author || "Volunteer"}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm text-gray-500 py-2 border-b border-gray-200">
                            <span>Uploaded</span>
                            <span class="font-mono text-gray-900">${Utils.formatDate(resource.timestamp)}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm text-gray-500 py-2 border-b border-gray-200">
                            <span>Size</span>
                            <span class="font-mono text-gray-900">${resource.size}</span>
                        </div>

                        <button onclick="window.Actions.downloadResource('${resource.id}', '${resource.downloadUrl}')" class="w-full bg-apple-blue hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-6 active:scale-95">
                            <span class="material-symbols-rounded">cloud_download</span>
                            Download File
                        </button>
                    </div>
                </div>

                <div class="w-full md:w-3/5 flex flex-col h-full min-h-[500px]">
                    <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 class="font-bold text-lg flex items-center gap-2">
                            Discussion 
                            <span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">${comments.length}</span>
                        </h3>
                        <button onclick="window.Actions.closeModal()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <span class="material-symbols-rounded text-gray-500 text-lg">close</span>
                        </button>
                    </div>

                    <div class="flex-grow overflow-y-auto p-6 custom-scrollbar">
                        ${comments.length === 0 
                            ? `<div class="text-center text-gray-400 py-10">
                                <span class="material-symbols-rounded text-4xl mb-2">chat_bubble_outline</span>
                                <p>No notes yet. Be the first to add insight!</p>
                               </div>` 
                            : Components.CommentThread(comments)
                        }
                    </div>

                    <div class="p-6 bg-gray-50 border-t border-gray-100">
                        <div class="relative">
                            <textarea id="main-comment-input" class="w-full p-4 pr-12 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 transition-all resize-none text-sm shadow-sm" rows="2" placeholder="Add a note or tip..."></textarea>
                            <button onclick="window.Actions.submitComment('${resource.id}')" class="absolute right-2 bottom-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center shadow-md">
                                <span class="material-symbols-rounded text-lg">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    UploadModal: () => `
    <div id="upload-backdrop" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-md fade-in" onclick="if(event.target === this) window.Actions.closeUploadModal()">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 slide-up relative">
            <button onclick="window.Actions.closeUploadModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <span class="material-symbols-rounded text-gray-500">close</span>
            </button>

            <h2 class="text-2xl font-bold mb-1">Share a Resource</h2>
            <p class="text-sm text-gray-500 mb-6">Help other volunteers by sharing your successful materials.</p>

            <form id="upload-form" onsubmit="event.preventDefault(); window.Actions.handleUpload();" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Your Name (Required)</label>
                    <input type="text" id="up-author" required class="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-apple-blue focus:outline-none transition-colors" placeholder="e.g. Sarah - Bitola" value="${Utils.getStoredAuthor()}">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Title</label>
                    <input type="text" id="up-title" required class="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-apple-blue focus:outline-none transition-colors" placeholder="e.g. Environment Club Week 1">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                        <select id="up-category" class="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-apple-blue focus:outline-none transition-colors">
                            <option>Camps</option>
                            <option>Clubs</option>
                            <option>E.E Lesson Plans</option>
                            <option>CD Resources</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">File Type</label>
                        <select id="up-type" class="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-apple-blue focus:outline-none transition-colors">
                            <option>PDF</option>
                            <option>DOCX</option>
                            <option>ZIP</option>
                            <option>PPTX</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tags (Separate by comma)</label>
                    <input type="text" id="up-tags" class="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-apple-blue focus:outline-none transition-colors" placeholder="e.g. winter, grade 7, low-budget">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                    <textarea id="up-desc" required rows="3" class="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-apple-blue focus:outline-none transition-colors resize-none" placeholder="Briefly explain what this is..."></textarea>
                </div>

                <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 hover:border-apple-blue transition-colors" onclick="document.getElementById('hidden-file').click()">
                    <span class="material-symbols-rounded text-3xl text-gray-400 mb-2">upload_file</span>
                    <p class="text-sm text-gray-500 font-medium" id="file-label">Click to select file (Max 10MB)</p>
                    <input type="file" id="hidden-file" required class="hidden" onchange="window.Actions.fileSelected(this)">
                </div>

                <button type="submit" id="upload-btn" class="w-full bg-black text-white font-bold py-3 rounded-xl shadow-lg hover:bg-gray-800 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                    Upload Resource
                </button>
            </form>
        </div>
    </div>
    `
};