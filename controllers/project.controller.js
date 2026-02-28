// project.controller.js
const projectService = require('../services/project.service');
const auditLogger = require('../utils/auditLogger');

exports.getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cursor, limit } = req.query;

    const { projects, nextCursor } = await projectService.getProjectsByUser(userId, cursor, limit);

    res.json({ success: true, projects, nextCursor });
  } catch (err) {
    console.error('❌ Error fetching projects:', err);
    res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'Server error' });
  }
};

exports.saveOrUpdateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const isUpdate = !!req.body._id;

    const project = await projectService.saveOrUpdateProject(userId, req.body);

    await auditLogger.logAction(userId, isUpdate ? 'PROJECT_UPDATED' : 'PROJECT_CREATED', req, {
      resourceId: project._id,
      resourceModel: 'Project',
      metadata: { title: project.projectName }
    });

    res.json({ success: true, project });
  } catch (err) {
    console.error("❌ Error saving project:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.status ? err.message : err.message
    });
  }
};
