import { db } from './src/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

async function seedResource() {
    try {
        const docRef = await addDoc(collection(db, 'resources'), {
            title: 'Downloadable Resource Test',
            description: 'This is a test resource with a valid file URL to verify the download button.',
            category: 'EE Lesson Plans',
            tags: ['Test', 'Download'],
            fileURL: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Public dummy PDF
            fileName: 'dummy.pdf',
            fileSize: '0.01',
            timeCommitment: 'Quick (< 1 hour)',
            cost: 'Free (0 MKD)',
            audience: 'Mixed Group',
            location: 'Skopje',
            createdAt: serverTimestamp(),
            userId: 'test-user-id',
            authorName: 'Test Bot',
            likes: 0,
            likedBy: [],
            upvotes: 0,
            upvotedBy: []
        });
        console.log("Document written with ID: ", docRef.id);
        process.exit(0);
    } catch (e) {
        console.error("Error adding document: ", e);
        process.exit(1);
    }
}

seedResource();
