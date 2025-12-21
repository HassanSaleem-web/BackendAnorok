// project.controller.js
const Project = require('../models/Project');

exports.saveOrUpdateProject = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware

    const {
      _id,
      projectName,
      projectLogo,
      message,
      chatSummary,
      milestones,
      tools,
      status
    } = req.body;

    // Normalize milestones
    const formattedMilestones = (milestones || []).map(m => ({
      step: m.step,
      title: m.title,
      description: m.description,
      completed: m.completed || false
    }));

    let project;

    // ----------------------------------------------------
    // UPDATE PROJECT (Only owner can update)
    // ----------------------------------------------------
    if (_id) {
      project = await Project.findOneAndUpdate(
        { _id, userId },    // ensure the logged-in user is the current owner
        {
          projectName,
          projectLogo,
          message,
          chatSummary,
          milestones: formattedMilestones,
          tools,
          ...(status && { status })   // status only updates if provided
        },
        { new: true }
      );

      if (!project) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized or project not found"
        });
      }

      return res.json({ success: true, project });
    }

    // ----------------------------------------------------
    // CREATE NEW PROJECT
    // ----------------------------------------------------
    project = await Project.create({
      userId,                     // current owner
      createdBy: userId,          // immutable — original creator
      projectName,
      projectLogo,
      message,
      chatSummary,
      milestones: formattedMilestones,
      tools,
      status: status || "live",

      // first ownership entry
      ownershipHistory: [
        {
          userId,
          changedAt: new Date()
        }
      ]
    });

    return res.json({ success: true, project });

  } catch (err) {
    console.error("❌ Error saving project:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
