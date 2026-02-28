const projectService = require('../../services/project.service');
const Project = require('../../models/Project');
const mongoose = require('mongoose');

describe('Project Service', () => {

    const user1Id = new mongoose.Types.ObjectId().toString();
    const user2Id = new mongoose.Types.ObjectId().toString();
    const hackerId = new mongoose.Types.ObjectId().toString();

    describe('saveOrUpdateProject', () => {
        it('should create a new project if no _id is provided', async () => {
            const projectData = {
                projectName: 'Test Project',
                message: 'A great new idea',
                chatSummary: 'Brief chat context',
                status: 'live'
            };

            const project = await projectService.saveOrUpdateProject(user1Id, projectData);

            expect(project).toBeDefined();
            expect(project.projectName).toBe('Test Project');
            expect(project.message).toBe('A great new idea');
            expect(project.userId.toString()).toBe(user1Id); // Should track ownership
            expect(project.status).toBe('live');
        });

        it('should update an existing project if _id is provided and belongs to user', async () => {
            // First create a project
            const initialProject = await projectService.saveOrUpdateProject(user1Id, {
                projectName: 'V1 Project',
                message: 'initial docs',
                chatSummary: 'chat 1'
            });

            // Then update it
            const updatedProject = await projectService.saveOrUpdateProject(user1Id, {
                _id: initialProject._id,
                projectName: 'V2 Project Updated'
            });

            expect(updatedProject).toBeDefined();
            expect(updatedProject._id.toString()).toBe(initialProject._id.toString());
            expect(updatedProject.projectName).toBe('V2 Project Updated');
        });

        it('should reject an update if the user does not own the project', async () => {
            const userProject = await projectService.saveOrUpdateProject(user1Id, {
                projectName: 'Secure Project',
                message: 'secure info',
                chatSummary: 'secure chat'
            });

            await expect(projectService.saveOrUpdateProject(hackerId, {
                _id: userProject._id,
                projectName: 'Hacked Project'
            })).rejects.toThrow('Unauthorized or project not found');
        });
    });

    describe('getProjectsByUser', () => {
        it('should fetch projects belonging only to the specified user', async () => {
            // Create 2 projects for userA and 1 for userB
            const baseData = { message: 'm', chatSummary: 'c' };
            await projectService.saveOrUpdateProject(user1Id, { projectName: 'A1', ...baseData });
            await projectService.saveOrUpdateProject(user1Id, { projectName: 'A2', ...baseData });
            await projectService.saveOrUpdateProject(user2Id, { projectName: 'B1', ...baseData });

            const result = await projectService.getProjectsByUser(user1Id, null, 10);

            expect(result.projects).toHaveLength(2);
            expect(result.projects[0].projectName).toMatch(/A[12]/);
            expect(result.projects[1].projectName).toMatch(/A[12]/);
        });
    });
});
