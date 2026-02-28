const Project = require('../models/Project');

exports.getProjectsByUser = async (userId, cursor, limit = 20) => {
    let query = { userId };
    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    const projects = await Project.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

    const nextCursor = projects.length > 0 ? projects[projects.length - 1].createdAt : null;
    return { projects, nextCursor };
};

exports.saveOrUpdateProject = async (userId, projectData) => {
    const {
        _id,
        projectName,
        projectLogo,
        message,
        chatSummary,
        milestones,
        tools,
        status
    } = projectData;

    // Normalize milestones
    const formattedMilestones = (milestones || []).map(m => ({
        step: m.step,
        title: m.title,
        description: m.description,
        completed: m.completed || false
    }));

    // Update existing project
    if (_id) {
        const project = await Project.findOneAndUpdate(
            { _id, userId }, // ensure the logged-in user is the current owner
            {
                projectName,
                projectLogo,
                message,
                chatSummary,
                milestones: formattedMilestones,
                tools,
                ...(status && { status })
            },
            { new: true }
        );

        if (!project) {
            const error = new Error("Unauthorized or project not found");
            error.status = 403;
            throw error;
        }
        return project;
    }

    // Create new project
    const project = await Project.create({
        userId,
        createdBy: userId,
        projectName,
        projectLogo,
        message,
        chatSummary,
        milestones: formattedMilestones,
        tools,
        status: status || "live",
        ownershipHistory: [{ userId, changedAt: new Date() }]
    });

    return project;
};
