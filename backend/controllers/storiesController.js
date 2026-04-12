const { Story } = require("../models/Model");

exports.getStories = async (req, res) => {
  try {
    // Optional id determines detail mode vs list mode.
    const { id } = req.params;
    const { view } = req.query;

    if (id) {
      // Detail mode: return one story and populate sprint name for UI display.
      const story = await Story.findById(id).populate("sprint", "name");
      if (!story) return res.status(404).json({ error: "Story not found" });
      return res.json(story);
    }

    // Validation mode: return only identity fields needed by selectors/modals.
    if (view === "validation") {
      const stories = await Story.find()
        .select("_id storyId storyName")
        .sort({ createdAt: -1 });

      return res.json(stories);
    }

    // List mode: return story-card fields and app names only.
    const stories = await Story.find()
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate comments status liveEnvRelease linkedApps.appName appsToBeDeployed"
      )
      .sort({ createdAt: -1 });

    return res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStoryDetails = async (req, res) => {
  try {
    // Route parameter holds existing storyId used for lookup.
    const { storyId: oldStoryId } = req.params;
    const body = req.body;

    // Copy request payload and normalize only fields supplied by caller.
    const updateFields = { ...body };

    // If storyId is being changed, validate uniqueness first.
    if (body.storyId !== undefined) {
      if (body.storyId.trim() !== oldStoryId) {
        const existingStory = await Story.findOne({ storyId: body.storyId.trim() });
        if (existingStory) {
          return res.status(400).json({ error: "Story ID already exists!" });
        }
      }
      updateFields.storyId = body.storyId.trim();
    }

    // Convert date-like fields to Date or null to support explicit clears.
    if (body.qaEnvRelDate !== undefined) {
      updateFields.qaEnvRelDate = body.qaEnvRelDate ? new Date(body.qaEnvRelDate) : null;
    }
    if (body.liveEnvRelease !== undefined) {
      updateFields.liveEnvRelease = body.liveEnvRelease ? new Date(body.liveEnvRelease) : null;
    }

    // Update by business key (storyId) and return updated story.
    const story = await Story.findOneAndUpdate(
      { storyId: oldStoryId },
      { $set: updateFields },
      { new: true }
    );

    if (!story) return res.status(404).json({ error: "Story not found" });
    res.json(story);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Story ID already exists!" });
    res.status(500).json({ error: err.message });
  }
};

exports.createNewStory = async (req, res) => {
  try {
    // Read create payload once and reuse for validations and mapping.
    const body = req.body;

    // Story ID is mandatory because this project uses it as a business identifier.
    if (!body.storyId || body.storyId.trim() === "") {
      return res.status(400).json({ error: "Story ID is required!" });
    }

    // Guard against duplicate story IDs before insert.
    const existingStory = await Story.findOne({ storyId: body.storyId.trim() });
    if (existingStory) {
      return res.status(400).json({ error: "Story ID already exists!" });
    }

    // Map inbound payload into schema fields and normalize optional values.
    const newStory = new Story({
      storyId: body.storyId.trim(),
      storyName: body.storyName?.trim(),
      sprint: body.sprint,
      releaseTag: body.releaseTag,
      storyPoints: body.storyPoints,
      comments: body.comments,
      epic: body.epic,
      category: body.category,
      type: body.type,
      responsibility: body.responsibility,
      firstReview: body.firstReview,
      qaEnvRelDate: body.qaEnvRelDate ? new Date(body.qaEnvRelDate) : undefined,
      status: body.status || "Pending",
      liveEnvRelease: body.liveEnvRelease ? new Date(body.liveEnvRelease) : undefined,
      appsToBeDeployed: body.appsToBeDeployed,
      linkedApps: body.linkedApps || [],
    });

    // Save and return created story document.
    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Story ID already exists in DB!" });
    }
    res.status(500).json({ error: err.message });
  }
};
