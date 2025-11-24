import { Store } from './store.js';
import { Utils } from './utils.js';
import { Components } from './components.js';

/**
 * ==========================================
 * MODULE: ACTIONS (GLOBAL API)
 * ==========================================
 */
export const Actions = {
    currentOpenResourceId: null,

    init: () => {
        Store.init();
        // Initial render happens after auth check in Store
        Actions.renderApp();
    },

    renderApp: () => {
        const app = document.getElementById('app');
        if (!app) return;
        
        app.innerHTML = `
            ${Components.Navbar()}
            ${Components.Hero()}
            ${Components.ResourceGrid()}
        `;

        // Restore search focus if needed
        const input = document.querySelector('input[type="text"]');
        if(input && Store.searchQuery) {
            input.focus();
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }
    },

    setCategory: (cat) => {
        Store.activeCategory = cat;
        Actions.renderApp();
    },

    handleSearch: (query) => {
        Store.searchQuery = query;
        Actions.renderApp();
    },

    openDetail: (id) => {
        Actions.currentOpenResourceId = id;
        const resource = Store.resources.find(r => r.id === id);
        if(!resource) return;

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = Components.DetailModal(resource);
        document.body.appendChild(modalDiv.firstElementChild);
        document.body.style.overflow = 'hidden';
    },

    closeModal: () => {
        const modal = document.getElementById('modal-backdrop');
        if (modal) {
            modal.classList.remove('fade-in');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
                Actions.currentOpenResourceId = null;
            }, 200);
        }
    },

    openUploadModal: () => {
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = Components.UploadModal();
        document.body.appendChild(modalDiv.firstElementChild);
        document.body.style.overflow = 'hidden';
    },

    closeUploadModal: () => {
        const modal = document.getElementById('upload-backdrop');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    },

    fileSelected: (input) => {
        const label = document.getElementById('file-label');
        if (input.files && input.files[0]) {
            label.innerText = input.files[0].name;
            label.classList.add('text-apple-blue');
        }
    },

    handleUpload: async () => {
        const btn = document.getElementById('upload-btn');
        const author = document.getElementById('up-author').value; 
        const title = document.getElementById('up-title').value;
        const category = document.getElementById('up-category').value;
        const type = document.getElementById('up-type').value;
        const tagsInput = document.getElementById('up-tags').value; 
        const desc = document.getElementById('up-desc').value;
        const fileInput = document.getElementById('hidden-file');

        if (!title || !desc || !fileInput.files[0] || !author) {
            Utils.showToast('Please fill in all fields & select file', 'error');
            return;
        }

        // Save Author Name
        Utils.setStoredAuthor(author);

        // Parse Tags
        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

        btn.disabled = true;
        btn.innerHTML = `<span class="spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span> Uploading...`;

        try {
            const file = fileInput.files[0];
            const fileSize = (file.size / 1024 / 1024).toFixed(1) + ' MB';

            const metadata = {
                title: title,
                category: category,
                description: desc,
                author: author,
                tags: tags,
                size: fileSize,
                type: type,
            };

            await Store.uploadResource(file, metadata);

            Actions.closeUploadModal();
            Utils.showToast('Resource uploaded successfully!');
        } catch (error) {
            btn.disabled = false;
            btn.innerHTML = 'Upload Resource';
            Utils.showToast('Upload failed: ' + error.message, 'error');
        }
    },

    downloadResource: (id, url) => {
        if(url) window.open(url, '_blank');
        else Utils.showToast("File not available", "error");

        Store.incrementDownload(id);
        Utils.showToast('Starting download...');
    },

    toggleReplyForm: (commentId) => {
        const form = document.getElementById(`reply-form-${commentId}`);
        if (form) form.classList.toggle('hidden');
    },

    submitComment: async (resourceId, parentCommentId = null) => {
        let text;
        let activeResourceId;

        if (parentCommentId) {
            text = document.getElementById(`reply-input-${parentCommentId}`).value;
            activeResourceId = Actions.currentOpenResourceId;
        } else {
            text = document.getElementById('main-comment-input').value;
            activeResourceId = resourceId;
        }

        if (!text.trim()) {
            Utils.showToast('Comment cannot be empty', 'error');
            return;
        }

        const authorName = Utils.getStoredAuthor();

        const newComment = {
            id: 'c_' + Utils.generateId(),
            author: authorName, 
            text: text,
            timestamp: new Date().toISOString(), 
            replies: []
        };

        try {
            await Store.addComment(activeResourceId, newComment, parentCommentId);

            const currentId = Actions.currentOpenResourceId;
            if(currentId) {
                setTimeout(() => {
                    const modal = document.getElementById('modal-backdrop');
                    if(modal) {
                        Actions.closeModal();
                        setTimeout(() => Actions.openDetail(currentId), 250);
                    }
                }, 500);
            }

            Utils.showToast('Insight added!');
        } catch (e) {
            console.error(e);
            Utils.showToast("Failed to post comment", "error");
        }
    }
};