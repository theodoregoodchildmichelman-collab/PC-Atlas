import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        currentUser: { uid: 'test-user-id', displayName: 'Test User' },
        onAuthStateChanged: vi.fn((auth, callback) => {
            callback({ uid: 'test-user-id', displayName: 'Test User' });
            return () => { };
        }),
        signInAnonymously: vi.fn(),
    })),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    increment: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
    serverTimestamp: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
}));

// Mock window.confirm
window.confirm = vi.fn(() => true);
window.alert = vi.fn();
