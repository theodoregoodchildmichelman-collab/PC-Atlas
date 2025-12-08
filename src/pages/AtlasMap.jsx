import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import ResourceMap from '../components/ResourceMap';

export default function AtlasMap({ onResourceClick }) {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'resources'));
                const resourcesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setResources(resourcesData);
            } catch (error) {
                console.error("Error fetching resources for map:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    return (
        <div className="h-[calc(100vh-80px)] w-full relative">
            <div className="absolute top-4 left-4 z-[1000]">
                <Link
                    to="/"
                    className="bg-white text-atlas-navy px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-rounded">arrow_back</span>
                    Back to Feed
                </Link>
            </div>

            {loading ? (
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-atlas-blue"></div>
                </div>
            ) : (
                <div className="h-full w-full">
                    <ResourceMap resources={resources} onResourceClick={onResourceClick} />
                </div>
            )}
        </div>
    );
}
