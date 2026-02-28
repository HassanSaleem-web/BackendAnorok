const listingService = require('../../services/listing.service');
const Listing = require('../../models/Listing');
const mongoose = require('mongoose');

describe('Listing Service', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const projectId = new mongoose.Types.ObjectId().toString();

    describe('createListing', () => {
        it('should create a listing correctly', async () => {
            const data = {
                projectId,
                title: 'Need a Full Stack Dev',
                description: 'Build a Next.js app',
                tags: '["React", "Node"]',
                price: '1000',
                priceType: 'fixed',
                deadline: '2026-12-31',
                percentageCompleted: '10'
            };

            const listing = await listingService.createListing(userId, data, null);

            expect(listing).toBeDefined();
            expect(listing.projectId.toString()).toBe(projectId);
            expect(listing.userId.toString()).toBe(userId);
            expect(listing.title).toBe('Need a Full Stack Dev');
            expect(listing.price).toBe(1000);
            expect(listing.tags).toContain('React');
            expect(listing.tags).toContain('Node');
        });

        it('should throw an error if no projectId is provided', async () => {
            await expect(listingService.createListing(userId, {
                title: 'Invalid Listing'
            }, null)).rejects.toThrow('projectId is required to create a listing');
        });
    });

    describe('updateListing', () => {
        it('should successfully update fields for an existing listing the user owns', async () => {
            const originalListing = await listingService.createListing(userId, {
                projectId,
                title: 'Original Title',
                description: 'Original description',
                price: 500
            }, null);

            const updatedListing = await listingService.updateListing(userId, originalListing._id, {
                title: 'Updated Title',
                price: 750
            }, null);

            expect(updatedListing.title).toBe('Updated Title');
            expect(updatedListing.price).toBe(750);
        });

        it('should throw Unauthorized if a different user tries to update the listing', async () => {
            const originalListing = await listingService.createListing(userId, {
                projectId,
                title: 'Original Title',
                description: 'Another secure listing description',
                price: 500
            }, null);

            const hackerId = new mongoose.Types.ObjectId().toString();

            await expect(listingService.updateListing(hackerId, originalListing._id, {
                title: 'Hacked Title'
            }, null)).rejects.toThrow('Not authorized');
        });
    });
});
