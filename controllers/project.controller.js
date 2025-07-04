// project.controller.js
const Project = require('../models/Project');

exports.saveOrUpdateProject = async (req, res) => {
  try {
    const { _id, title, chatSummary, milestones } = req.body;

    const updatedMilestones = milestones.map(m => ({
      title: m.title,
      description: m.description,
      completed: m.completed || false
    }));

    let project;
    if (_id) {
      // Update existing
      project = await Project.findByIdAndUpdate(
        _id,
        { title, chatSummary, milestones: updatedMilestones },
        { new: true }
      );
    } else {
      // Create new
      project = await Project.create({ title, chatSummary, milestones: updatedMilestones });
    }

    res.json({ success: true, project });
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
