import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResourceCard from '../components/ResourceCard';

describe('ResourceCard', () => {
    const mockResource = {
        id: '1',
        title: 'Test Resource',
        description: 'Test Description',
        category: 'Education',
        authorName: 'TestUser',
        likes: 10,
        likedBy: [],
        upvotes: 5,
        fileSize: '1.2 MB',
        timeCommitment: 'Quick',
        cost: 'Free',
        audience: 'Kids',
        location: 'Skopje',
        tags: ['Tag1']
    };

    const mockHandlers = {
        onClick: vi.fn(),
        onLike: vi.fn(),
        onUpvote: vi.fn(),
        onDownload: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn()
    };

    it('renders resource details correctly', () => {
        render(<ResourceCard resource={mockResource} {...mockHandlers} userName="OtherUser" />);

        expect(screen.getByText('Test Resource')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Tag1')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('shows Edit/Delete buttons only for the author', () => {
        // Render as author
        const { rerender } = render(
            <ResourceCard resource={mockResource} {...mockHandlers} userName="TestUser" />
        );

        expect(screen.getByText('edit')).toBeInTheDocument();
        expect(screen.getByText('delete')).toBeInTheDocument();

        // Render as non-author
        rerender(
            <ResourceCard resource={mockResource} {...mockHandlers} userName="OtherUser" />
        );

        expect(screen.queryByText('edit')).not.toBeInTheDocument();
        expect(screen.queryByText('delete')).not.toBeInTheDocument();
    });

    it('calls handlers when buttons are clicked', () => {
        render(<ResourceCard resource={mockResource} {...mockHandlers} userName="TestUser" />);

        // Click Edit
        fireEvent.click(screen.getByText('edit'));
        expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockResource);

        // Click Delete
        fireEvent.click(screen.getByText('delete'));
        expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockResource);
    });
});
