const { Release, Story } = require("../models/Model");

exports.createRelease = async (req, res) => {
  try {
    // Read incoming release payload from request body.
    const { name, releaseDate, category, devCutoff, qaSignoff } = req.body;

    // Block empty names early so DB does not get invalid release tags.
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Release Name is required!" });
    }

    // Enforce case-insensitive uniqueness before insert for cleaner UX.
    const existingRelease = await Release.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existingRelease) {
      return res.status(400).json({ error: "Release Tag already exists!" });
    }

    // Normalize payload and convert date strings into Date objects.
    const newRelease = new Release({
      name: name.trim(),
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      devCutoff: devCutoff ? new Date(devCutoff) : undefined,
      qaSignoff: qaSignoff ? new Date(qaSignoff) : undefined,
      category: category || "General",
    });

    // Persist release and return the created document.
    await newRelease.save();
    res.status(201).json(newRelease);
  } catch (err) {
    // Handle duplicate key collisions from DB-level unique constraints.
    if (err.code === 11000) {
      return res.status(400).json({ error: "Release Tag already exists in DB!" });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.getReleases = async (req, res) => {
  try {
    // Optional param decides whether we return full release list or one release with stories.
    const { releaseId } = req.params;
    const namesOnly = req.query.namesOnly === "true";

    if (releaseId) {
      // Fetch one release for detail page.
      const release = await Release.findById(releaseId);
      if (!release) return res.status(404).json({ error: "Release not found" });

      // Fetch stories tagged with this release name.
      const stories = await Story.find({ releaseTag: release.name })
        .select(
          "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate releaseTag comments appsToBeDeployed linkedApps.appName linkedApps.featureBranch status liveEnvRelease"
        )
        .sort({ createdAt: -1 });

      return res.json({ release, stories });
    }

    // List mode: support names-only payload for dropdown hydration.
    const selectFields = namesOnly
      ? "_id name"
      : "_id name releaseDate devCutoff qaSignoff category createdAt updatedAt";

    // Default branch: return releases sorted by latest release date first.
    const releases = await Release.find()
      .select(selectFields)
      .sort({ releaseDate: -1 });
    return res.json(releases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRelease = async (req, res) => {
  try {
    // Read route id and client update payload.
    const releaseId = req.params.releaseId;
    const body = req.body;

    // Start with a shallow copy, then normalize fields conditionally.
    const updateFields = { ...body };

    // We need current release to support existence check and name cascade logic.
    const oldRelease = await Release.findById(releaseId);
    if (!oldRelease) {
      return res.status(404).json({ error: "Release not found" });
    }

    // Trim/normalize scalar values if caller sent them.
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.category !== undefined) updateFields.category = body.category || "General";

    // Convert date fields into Date or null to support explicit clearing.
    if (body.releaseDate !== undefined) {
      updateFields.releaseDate = body.releaseDate ? new Date(body.releaseDate) : null;
    }
    if (body.devCutoff !== undefined) {
      updateFields.devCutoff = body.devCutoff ? new Date(body.devCutoff) : null;
    }
    if (body.qaSignoff !== undefined) {
      updateFields.qaSignoff = body.qaSignoff ? new Date(body.qaSignoff) : null;
    }

    // Apply partial update and return updated document.
    const updatedRelease = await Release.findByIdAndUpdate(
      releaseId,
      { $set: updateFields },
      { new: true }
    );

    // If release tag name changed, propagate the new tag to all linked stories.
    if (updateFields.name && oldRelease.name !== updateFields.name) {
      await Story.updateMany(
        { releaseTag: oldRelease.name },
        { $set: { releaseTag: updateFields.name } }
      );
    }

    res.json(updatedRelease);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Release Tag already exists!" });
    }
    res.status(500).json({ error: err.message });
  }
};
