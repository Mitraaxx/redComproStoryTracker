const { Sprint, App, Story, Release } = require("../models/model");

/**
 * Fetches a list of all sprints, returning only essential fields, sorted alphabetically.
 */
exports.getAllSprints = async (req, res) => {
  try {
    const sprints = await Sprint.find().select("_id name startDate endDate").sort({ name: 1 });
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves details of a specific sprint along with all the stories assigned to it.
 */
exports.getSprintStories = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.sprintId).select(
      "name startDate endDate sprintNotes",
    );

    const stories = await Story.find({ sprint: req.params.sprintId })
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate comments status liveEnvRelease linkedApps",
      )
      .populate("linkedApps.appRef", "name");

    res.json({ sprint, stories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Fetches all stories in the database.
 */
exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate comments status liveEnvRelease linkedApps",
      )
      .populate("linkedApps.appRef", "name")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves the full details of a specific story by its database ID, including populated references.
 */
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("sprint", "name")
      .populate("linkedApps.appRef", "name");

    if (!story) return res.status(404).json({ error: "Not found" });

    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates only the metadata and basic details of an existing story.
 * Includes a validation check to ensure a changed Story ID is not duplicated.
 */
exports.updateStoryDetails = async (req, res) => {
  try {
    const { storyId: oldStoryId } = req.params;
    const {
      storyId: newStoryId, 
      storyName,
      sprintName,
      sprintId,
      sprint,
      releaseTag,
      storyPoints,
      comments,
      epic,
      category,
      type,
      responsibility,
      firstReview,
      qaEnvRelDate,
      status, 
      liveEnvRelease,
      appsToBeDeployed, 
    } = req.body;

    if (newStoryId && newStoryId.trim() !== oldStoryId) {
      const existingStory = await Story.findOne({ storyId: newStoryId.trim() });
      if (existingStory) {
        return res.status(400).json({ error: "Story ID already exists!" });
      }
    }

    let finalSprintRef;

    if (sprintId !== undefined) {
      finalSprintRef = sprintId;
    } else if (sprint !== undefined) {
      finalSprintRef = sprint;
    } else if (sprintName !== undefined) {
      if (sprintName.trim() === "") {
        finalSprintRef = null;
      } else {
        const foundSprint = await Sprint.findOne({ name: sprintName.trim() });
        if (!foundSprint) {
          return res.status(400).json({ error: "Selected Sprint does not exist." });
        }
        finalSprintRef = foundSprint._id;
      }
    }

    const story = await Story.findOneAndUpdate(
      { storyId: oldStoryId },
      {
        storyId: newStoryId ? newStoryId.trim() : oldStoryId, 
        storyName,
        sprint: finalSprintRef,
        releaseTag,
        storyPoints,
        comments,
        epic,
        category,
        type,
        responsibility, 
        firstReview,
        qaEnvRelDate: qaEnvRelDate ? new Date(qaEnvRelDate) : undefined,
        status,
        liveEnvRelease: liveEnvRelease ? new Date(liveEnvRelease) : undefined,
        appsToBeDeployed, 
      },
      { new: true },
    );

    if (!story) return res.status(404).json({ error: "Story not found" });
    res.json(story);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Story ID already exists!" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Replaces or updates the linked applications and feature branches for a specific story.
 */
exports.updateStoryApps = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { appsData = [] } = req.body;

    const linkedApps = await Promise.all(
      appsData
        .filter((a) => a.appName?.trim())
        .map(async (a) => {
          const app = await App.findOneAndUpdate(
            { name: a.appName.trim() },
            { name: a.appName.trim() },
            { new: true, upsert: true },
          );

          return {
            appRef: app._id,
            featureBranches: Array.isArray(a.featureBranches)
              ? a.featureBranches
              : a.featureBranches
                  ?.split(",")
                  .map((b) => b.trim())
                  .filter(Boolean) || [],
            baseBranch: a.baseBranch,
            dependencies: a.dependencies,
            notes: a.notes,
          };
        }),
    );

    const story = await Story.findOneAndUpdate(
      { storyId },
      { linkedApps },
      { new: true },
    );

    if (!story) return res.status(404).json({ error: "Story not found" });
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates the details (name, dates, notes) of an existing sprint.
 */
exports.updateSprintDetails = async (req, res) => {
  try {
    const { name, startDate, endDate, sprintNotes } = req.body;

    const sprint = await Sprint.findByIdAndUpdate(
      req.params.sprintId,
      {
        name: name ? name.trim() : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sprintNotes: sprintNotes,
      },
      { new: true },
    );

    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    res.json(sprint);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Sprint Name already exists!" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a new sprint in the database, preventing duplicate sprint names.
 */
exports.createSprint = async (req, res) => {
  try {
    const { name, startDate, endDate, sprintNotes } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Sprint Name is required!" });
    }

    const existingSprint = await Sprint.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingSprint) {
      return res.status(400).json({ error: "Sprint Name already exists!" });
    }

    const newSprint = new Sprint({
      name: name.trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sprintNotes: sprintNotes,
    });

    await newSprint.save();

    res.status(201).json(newSprint);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "Sprint Name already exists in Database!" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a brand new story from scratch, formatting associated apps and validating the ID.
 */
exports.createNewStory = async (req, res) => {
  try {
    const {
      storyId,
      storyName,
      releaseTag,
      storyPoints,
      comments,
      epic,
      category,
      type,
      responsibility,
      firstReview,
      qaEnvRelDate,
      status, 
      liveEnvRelease,
      appsToBeDeployed, 
      appsData = [],
      sprintId,
    } = req.body;

    if (!storyId || storyId.trim() === "") {
      return res.status(400).json({ error: "Story ID is required!" });
    }
    const existingStory = await Story.findOne({ storyId: storyId.trim() });
    if (existingStory) {
      return res.status(400).json({ error: "Story ID already exists!" });
    }

    const linkedApps = await Promise.all(
      appsData
        .filter((a) => a.appName?.trim())
        .map(async (a) => {
          const app = await App.findOneAndUpdate(
            { name: a.appName.trim() },
            { name: a.appName.trim() },
            { new: true, upsert: true },
          );

          return {
            appRef: app._id,
            featureBranches: Array.isArray(a.featureBranches)
              ? a.featureBranches
              : a.featureBranches
                  ?.split(",")
                  .map((b) => b.trim())
                  .filter(Boolean) || [],
            baseBranch: a.baseBranch,
            dependencies: a.dependencies,
            notes: a.notes,
          };
        }),
    );

    const newStory = new Story({
      storyId: storyId.trim(),
      storyName,
      sprint: sprintId,
      linkedApps,
      releaseTag,
      storyPoints,
      comments,
      epic,
      category,
      type,
      responsibility, 
      firstReview,
      qaEnvRelDate: qaEnvRelDate ? new Date(qaEnvRelDate) : undefined,
      status: status || "Pending",
      liveEnvRelease: liveEnvRelease ? new Date(liveEnvRelease) : undefined,
      appsToBeDeployed, 
    });

    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Story ID already exists in DB!" });
    res.status(500).json({ error: err.message });
  }
};


/**
 * Retrieves all registered releases, sorted with the newest releases first.
 */
exports.getAllReleases = async (req, res) => {
  try {
    const releases = await Release.find().sort({ releaseDate: -1 });
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a new release tag, checking to ensure the release name is unique.
 */
exports.createRelease = async (req, res) => {
  try {
    const { name, releaseDate, category, devCutoff, qaSignoff } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Release Name is required!" });
    }

    const existingRelease = await Release.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingRelease) {
      return res.status(400).json({ error: "Release Tag already exists!" });
    }

    const newRelease = new Release({
      name: name.trim(),
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      devCutoff: devCutoff ? new Date(devCutoff) : undefined, 
      qaSignoff: qaSignoff ? new Date(qaSignoff) : undefined, 
      category: category || "General",
    });

    await newRelease.save();
    res.status(201).json(newRelease);
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(400)
        .json({ error: "Release Tag already exists in DB!" });
    res.status(500).json({ error: err.message });
  }
};

/**
 * Fetches details for a specific release and retrieves all stories tagged with that release.
 */
exports.getReleaseStories = async (req, res) => {
  try {
    const release = await Release.findById(req.params.releaseId);
    if (!release) return res.status(404).json({ error: "Release not found" });

    const stories = await Story.find({ releaseTag: release.name })
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate releaseTag comments appsToBeDeployed linkedApps status liveEnvRelease",
      )
      .populate("linkedApps.appRef", "name")
      .sort({ createdAt: -1 });

    res.json({ release, stories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates release details. If the release name is modified, it cascades the update 
 * to all stories carrying the old release tag.
 */
exports.updateRelease = async (req, res) => {
  try {
    const { name, releaseDate, category, appsToBeDeployed, devCutoff, qaSignoff } = req.body;
    
    const releaseId = req.params.releaseId;

    const oldRelease = await Release.findById(releaseId);
    if (!oldRelease)
      return res.status(404).json({ error: "Release not found" });

    const oldName = oldRelease.name;
    const newName = name ? name.trim() : oldName;

    const updatedRelease = await Release.findByIdAndUpdate(
      releaseId,
      { 
        name: newName,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        devCutoff: devCutoff ? new Date(devCutoff) : undefined, 
        qaSignoff: qaSignoff ? new Date(qaSignoff) : undefined, 
        category: category || "General",
        appsToBeDeployed: appsToBeDeployed !== undefined ? appsToBeDeployed : oldRelease.appsToBeDeployed
      },
      { new: true }
    );

    if (oldName !== newName) {
      await Story.updateMany(
        { releaseTag: oldName },
        { $set: { releaseTag: newName } },
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

/**
 * Fetches all stories tied to a specific application by the app's name.
 */
exports.getAppStoriesByName = async (req, res) => {
  try {
    const { appName } = req.params;
    const app = await App.findOne({ name: appName });

    if (!app) {
      return res.json({ app: { name: appName }, stories: [] });
    }

    const stories = await Story.find({ "linkedApps.appRef": app._id })
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate releaseTag comments status liveEnvRelease linkedApps",
      )
      .populate("linkedApps.appRef", "name")
      .sort({ createdAt: -1 });

    res.json({ app, stories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Queries the GitHub API to check if a specific branch has been merged, and into which target branch.
 */
exports.getBranchMergeStatus = async (req, res) => {
  try {
    const { orgName, repoName, branchName, token } = req.body; 
    if (!token) {
      return res.status(401).json({ error: "GitHub token missing in request body" });
    }

    const githubUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?head=${orgName}:${branchName}&state=all`;
    
    const githubResponse = await fetch(githubUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!githubResponse.ok) {
      const errData = await githubResponse.json();
      throw new Error(`GitHub API Error: ${errData.message || "Not Found"}`);
    }

    const prs = await githubResponse.json();

    let latestMergeTime = 0; 
    let latestMergedBranch = "Not Merged";

    prs.forEach(pr => {
      if (pr.merged_at !== null) {
        const mergeTime = new Date(pr.merged_at).getTime(); 

        if (mergeTime > latestMergeTime) {
          latestMergeTime = mergeTime;
          latestMergedBranch = pr.base.ref; 
        }
      }
    });

    res.status(200).json({
      branch: branchName,
      mergedTill: latestMergedBranch 
    });

  } catch (err) {
    console.error("Error fetching branch status:", err);
    res.status(500).json({ error: err.message });
  }
};