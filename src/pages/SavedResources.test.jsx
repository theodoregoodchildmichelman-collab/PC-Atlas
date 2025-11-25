import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SavedResources from '../pages/SavedResources';
import { onSnapshot } from 'firebase/firestore';

// Mock ResourceCard
vi.mock('../components/ResourceCard', () => ({
    default: ({ resource }) => <div data-testid="resource-card">{resource.title}</div>
}));

describe('SavedResources', () => {
    const mockSavedResources = [
        { id: '1', title: 'Saved Resource 1', likedBy: ['test-user-id'] },
        { id: '2', title: 'Saved Resource 2', likedBy: ['test-user-id'] },
    ];

    beforeEach(() => {
        onSnapshot.mockImplementation((query, callback) => {
            callback({
                docs: mockSavedResources.map(r => ({
                    id: r.id,
                    data: () => r
                }))
            });
            return () => { };
        });
    });

    it('renders saved resources', async () => {
        render(<SavedResources userName="TestUser" />);

        await waitFor(() => {
            expect(screen.getByText('Saved Resource 1')).toBeInTheDocument();
            expect(screen.getByText('Saved Resource 2')).toBeInTheDocument();
        });
    });

    it('shows empty state when no resources are saved', async () => {
        onSnapshot.mockImplementation((query, callback) => {
            callback({ docs: [] });
            return () => { };
        });

        render(<SavedResources userName="TestUser" />);

        await waitFor(() => {
            expect(screen.getByText(/No Saved Items Yet/i)).toBeInTheDocument();
        });
    });
});
