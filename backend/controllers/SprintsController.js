const { Sprint, Story } = require("../models/Model");

exports.getSprints = async (req, res) => {
  try {
    // Route may include sprintId for detail mode, otherwise list mode is used.
    const { sprintId } = req.params;
    const namesOnly = req.query.namesOnly === "true";

    if (sprintId) {
      // Detail mode: Fetch the sprint header/details required by the sprint detail screen.
      const sprint = await Sprint.findById(sprintId).select("name startDate endDate sprintNotes");
      if (!sprint) {
        return res.status(404).json({ error: "Sprint not found" });
      }

      // Fetch all stories linked to this sprint id.
      const stories = await Story.find({ sprint: sprintId }).select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate comments status liveEnvRelease linkedApps.appName"
      );

      return res.json({ sprint, stories });
    }

    // List mode: support names-only response for dropdown hydration.
    const selectFields = namesOnly
      ? "_id name"
      : "_id name startDate endDate";

    // Return compact sprint cards sorted by name.
    const sprints = await Sprint.find()
      .select(selectFields)
      .sort({ name: 1 });

    return res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSprintDetails = async (req, res) => {
  try {
    // Copy incoming delta payload so we can normalize only provided fields.
    const body = req.body;
    const updateFields = { ...body };

    // Normalize name if caller sent it.
    if (body.name !== undefined) {
      updateFields.name = body.name.trim();
    }

    // Convert dates to Date instances, or null when explicitly cleared.
    if (body.startDate !== undefined) {
      updateFields.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      updateFields.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    // Persist update and return new state after update.
    const sprint = await Sprint.findByIdAndUpdate(
      req.params.sprintId,
      { $set: updateFields },
      { new: true }
    );

    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    res.json(sprint);
  } catch (err) {
    // Duplicate key usually means sprint name conflict on unique index.
    if (err.code === 11000) {
      return res.status(400).json({ error: "Sprint Name already exists!" });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.createSprint = async (req, res) => {
  try {
    // Read create payload from request body.
    const { name, startDate, endDate, sprintNotes } = req.body;

    // Validate required name before DB operations.
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Sprint Name is required!" });
    }

    // Prevent duplicate sprint names (case-insensitive check for better UX).
    const existingSprint = await Sprint.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existingSprint) {
      return res.status(400).json({ error: "Sprint Name already exists!" });
    }

    // Build and save sprint document.
    const newSprint = new Sprint({
      name: name.trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sprintNotes,
    });

    await newSprint.save();
    res.status(201).json(newSprint);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Sprint Name already exists in Database!" });
    }
    res.status(500).json({ error: err.message });
  }
};
