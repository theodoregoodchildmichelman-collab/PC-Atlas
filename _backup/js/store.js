import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { Utils } from './utils.js';

// --- CONFIGURATION START ---
let firebaseConfig;
let appId = 'default-riznica';

try {
    if (typeof __firebase_config !== 'undefined') {
        firebaseConfig = JSON.parse(__firebase_config);
        if (typeof __app_id !== 'undefined') {
            appId = __app_id.replace(/[.#$[\]]/g, '_');
        }
    } else {
        throw new Error("Use fallback");
    }
} catch (e) {
    // --- YOUR SPECIFIC KEYS ARE HERE ---
    firebaseConfig = {
        apiKey: "AIzaSyA7ubplpyeEMOZKgD5yk3xUrWB8Q4ztltI",
        authDomain: "pc-repository.firebaseapp.com",
        projectId: "pc-repository",
        storageBucket: "pc-repository.firebasestorage.app",
        messagingSenderId: "938359035802",
        appId: "1:938359035802:web:27cf9ff75c2f4edf6acc23",
        measurementId: "G-4L9QX1QJPC",
        databaseURL: "https://pc-repository-default-rtdb.firebaseio.com/"
    };
}
// --- CONFIGURATION END ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); 
const storage = getStorage(app);
const auth = getAuth(app);

const RESOURCES_PATH = `artifacts/${appId}/public/data/resources`;

/**
 * ==========================================
 * MODULE: STATE & DATA STORE
 * ==========================================
 */
export const Store = {
    resources: [],
    activeCategory: 'All',
    searchQuery: '',
    currentUser: null,
    loading: true,

    init() {
        this.authenticate();
    },

    async authenticate() {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Auth Error:", error);
            Utils.showToast("Authentication failed.", "error");
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.subscribeToData();
            }
        });
    },

    subscribeToData() {
        if (!this.currentUser) return;

        const resourcesRef = ref(db, RESOURCES_PATH);

        onValue(resourcesRef, (snapshot) => {
            const data = snapshot.val();
            const loaded = [];

            if (data) {
                Object.keys(data).forEach(key => {
                    loaded.push({ id: key, ...data[key] });
                });
            }

            // Client-side sort
            this.resources = loaded.sort((a, b) => {
                const dateA = new Date(a.timestamp || a.date);
                const dateB = new Date(b.timestamp || b.date);
                return dateB - dateA;
            });

            this.loading = false;
            // Check if Actions is available globally to trigger render
            if(window.Actions && window.Actions.renderApp) {
                window.Actions.renderApp();
            }
        }, (error) => {
            console.error("Data Fetch Error:", error);
            this.loading = false;
            if(window.Actions && window.Actions.renderApp) {
                window.Actions.renderApp();
            }
        });
    },

    async uploadResource(file, metadata) {
        try {
            // 1. Upload File to Storage
            const storageRef = sRef(storage, `uploads/${appId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Push Metadata to Realtime DB
            const resourcesRef = ref(db, RESOURCES_PATH);
            const newResourceRef = push(resourcesRef); 

            const docData = {
                ...metadata,
                downloadUrl: downloadURL,
                authorId: this.currentUser.uid,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString(),
                downloads: 0,
                comments: [] 
            };

            await set(newResourceRef, docData);
            return true;
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    },

    async addComment(resourceId, commentObject, parentCommentId = null) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;

        let currentComments = resource.comments ? JSON.parse(JSON.stringify(resource.comments)) : [];

        if (parentCommentId) {
            const findAndReply = (list) => {
                for (let c of list) {
                    if (c.id === parentCommentId) {
                        if(!c.replies) c.replies = [];
                        c.replies.push(commentObject);
                        return true;
                    }
                    if (c.replies && c.replies.length > 0) {
                        if (findAndReply(c.replies)) return true;
                    }
                }
                return false;
            };
            findAndReply(currentComments);
        } else {
            currentComments.push(commentObject);
        }

        const resourceRef = ref(db, `${RESOURCES_PATH}/${resourceId}`);
        await update(resourceRef, {
            comments: currentComments
        });
    },

    async incrementDownload(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;

        const currentDownloads = resource.downloads || 0;
        const resourceRef = ref(db, `${RESOURCES_PATH}/${resourceId}`);
        await update(resourceRef, {
            downloads: currentDownloads + 1
        });
    },

    getFilteredResources() {
        const q = this.searchQuery.toLowerCase();
        return this.resources.filter(r => {
            const matchesCategory = this.activeCategory === 'All' || r.category === this.activeCategory;
            const matchesTitle = r.title.toLowerCase().includes(q);
            const matchesDesc = r.description.toLowerCase().includes(q);
            const matchesTags = r.tags && r.tags.some(t => t.toLowerCase().includes(q));

            return matchesCategory && (matchesTitle || matchesDesc || matchesTags);
        });
    }
};