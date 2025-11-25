import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Feed from './Feed';
import { onSnapshot } from 'firebase/firestore';

// Mock child components to simplify testing
vi.mock('./ResourceCard', () => ({
    default: ({ resource }) => <div data-testid="resource-card">{resource.title}</div>
}));

vi.mock('./FilterSidebar', () => ({
    default: ({ filters, onFilterChange }) => (
        <div data-testid="filter-sidebar">
            <button onClick={() => onFilterChange('cost', 'Free (0 MKD)')}>Filter Free</button>
        </div>
    )
}));

describe('Feed Filtering', () => {
    const mockResources = [
        { id: '1', title: 'Free Resource', cost: 'Free (0 MKD)', category: 'Education', tags: [], timeCommitment: 'Quick', audience: 'Kids', location: 'Skopje', createdAt: { toDate: () => new Date() } },
        { id: '2', title: 'Paid Resource', cost: 'Low Cost', category: 'Education', tags: [], timeCommitment: 'Medium', audience: 'Adults', location: 'Bitola', createdAt: { toDate: () => new Date() } },
    ];

    beforeEach(() => {
        // Mock Firestore onSnapshot to return mockResources immediately
        onSnapshot.mockImplementation((query, callback) => {
            callback({
                docs: mockResources.map(r => ({
                    id: r.id,
                    data: () => r
                }))
            });
            return () => { }; // Unsubscribe function
        });
    });

    it('renders all resources initially', async () => {
        render(<Feed userName="TestUser" />);

        await waitFor(() => {
            expect(screen.getByText('Free Resource')).toBeInTheDocument();
            expect(screen.getByText('Paid Resource')).toBeInTheDocument();
        });
    });

    // Note: Testing the actual filtering logic inside Feed is tricky because it's internal state.
    // However, we can test the effect of the filter change.
    // Since we mocked FilterSidebar, we can simulate a filter change.

    // Wait, Feed.jsx implements the filtering logic *inside* the component based on `filters` state.
    // If we trigger the `onFilterChange` prop passed to `FilterSidebar`, `Feed` should update.

    it('filters resources when filter is applied', async () => {
        render(<Feed userName="TestUser" />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText('Free Resource')).toBeInTheDocument();
        });

        // Click the mock filter button
        fireEvent.click(screen.getByText('Filter Free'));

        // Should show Free Resource, should NOT show Paid Resource
        await waitFor(() => {
            expect(screen.getByText('Free Resource')).toBeInTheDocument();
            expect(screen.queryByText('Paid Resource')).not.toBeInTheDocument();
        });
    });
});
