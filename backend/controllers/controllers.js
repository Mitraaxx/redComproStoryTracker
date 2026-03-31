const { Sprint, App, Story, Release } = require("../models/model");

// ================= CREATE / UPDATE STORY =================
exports.createStoryEntry = async (req, res) => {
  try {
    const {
      storyId,
      storyName,
      sprintName,
      sprintStartDate,
      sprintEndDate,
      sprintNotes,
      releaseTag,
      storyPoints,
      comments,
      epic,
      category,
      type,
      responsibility, // 👈 type add kiya
      firstReview,
      qaEnvRelDate,
      status,
      liveEnvRelease,
      appsToBeDeployed, // 👈 Naya naam add kiya
      appsData = [],
    } = req.body;

    const sprint = sprintName?.trim()
      ? await Sprint.findOneAndUpdate(
          { name: sprintName.trim() },
          {
            name: sprintName.trim(),
            startDate: sprintStartDate ? new Date(sprintStartDate) : undefined,
            endDate: sprintEndDate ? new Date(sprintEndDate) : undefined,
            sprintNotes: sprintNotes,
          },
          { new: true, upsert: true },
        )
      : null;

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
      {
        storyName,
        sprint: sprint?._id,
        linkedApps,
        releaseTag: releaseTag,
        storyPoints,
        comments,
        epic,
        category,
        type, // 👈 type save hoga
        responsibility,
        firstReview,
        qaEnvRelDate: qaEnvRelDate ? new Date(qaEnvRelDate) : undefined,
        status,
        liveEnvRelease: liveEnvRelease ? new Date(liveEnvRelease) : undefined,
        appsToBeDeployed, // 👈 naya naam save hoga
      },
      { new: true, upsert: true },
    );

    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= SPRINT =================

exports.getAllSprints = async (req, res) => {
  const sprints = await Sprint.find().select("_id name startDate endDate").sort({ name: 1 });
  res.json(sprints);
};

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

// ================= STORY =================

exports.getAllStories = async (req, res) => {
  const stories = await Story.find()
    .select(
      "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate comments status liveEnvRelease linkedApps",
    )
    .populate("linkedApps.appRef", "name")
    .sort({ createdAt: -1 });

  res.json(stories);
};

exports.getStoryById = async (req, res) => {
  const story = await Story.findById(req.params.id)
    .populate("sprint", "name")
    .populate("linkedApps.appRef", "name");

  if (!story) return res.status(404).json({ error: "Not found" });

  res.json(story);
};

// ================= APP =================
exports.getAllApps = async (req, res) => {
  const apps = await App.find().select("_id name").sort({ name: 1 });
  res.json(apps);
};

exports.getAppDetails = async (req, res) => {
  const app = await App.findById(req.params.appId).select("_id name");
  if (!app) return res.status(404).json({ error: "App not found" });

  const stories = await Story.find({
    "linkedApps.appRef": req.params.appId,
  })
    .select("_id storyId storyName")
    .sort({ createdAt: -1 });

  res.json({ app, stories });
};

// ================= UPDATE STORY DETAILS ONLY =================
exports.updateStoryDetails = async (req, res) => {
  try {
    const { storyId } = req.params;
    const {
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
      status, // 👈 type add kiya
      liveEnvRelease,
      appsToBeDeployed, // 👈 naya naam add kiya
    } = req.body;

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
          return res
            .status(400)
            .json({ error: "Selected Sprint does not exist." });
        }
        finalSprintRef = foundSprint._id;
      }
    }

    const story = await Story.findOneAndUpdate(
      { storyId },
      {
        storyName,
        sprint: finalSprintRef,
        releaseTag,
        storyPoints,
        comments,
        epic,
        category,
        type,
        responsibility, // 👈 type
        firstReview,
        qaEnvRelDate: qaEnvRelDate ? new Date(qaEnvRelDate) : undefined,
        status,
        liveEnvRelease: liveEnvRelease ? new Date(liveEnvRelease) : undefined,
        appsToBeDeployed, // 👈 naya naam
      },
      { new: true },
    );

    if (!story) return res.status(404).json({ error: "Story not found" });
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE STORY'S APPS ONLY =================
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

// ================= UPDATE SPRINT DETAILS =================
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

// ================= CREATE NEW SPRINT =================
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

// ================= CREATE NEW STORY =================
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
      status, // 👈 type
      liveEnvRelease,
      appsToBeDeployed, // 👈 naya naam
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
      responsibility, // 👈 type
      firstReview,
      qaEnvRelDate: qaEnvRelDate ? new Date(qaEnvRelDate) : undefined,
      status: status || "Pending",
      liveEnvRelease: liveEnvRelease ? new Date(liveEnvRelease) : undefined,
      appsToBeDeployed, // 👈 naya naam
    });

    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Story ID already exists in DB!" });
    res.status(500).json({ error: err.message });
  }
};

// ================= ADD NEW APP TO EXISTING STORY =================
exports.addAppToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { appName, featureBranches, baseBranch, dependencies, notes } =
      req.body;

    if (!appName || appName.trim() === "") {
      return res.status(400).json({ error: "App Name is required" });
    }

    const app = await App.findOneAndUpdate(
      { name: appName.trim() },
      { name: appName.trim() },
      { new: true, upsert: true },
    );

    const newAppEntry = {
      appRef: app._id,
      featureBranches: Array.isArray(featureBranches)
        ? featureBranches
        : featureBranches
            ?.split(",")
            .map((b) => b.trim())
            .filter(Boolean) || [],
      baseBranch,
      dependencies,
      notes,
    };

    const story = await Story.findOneAndUpdate(
      { storyId },
      { $push: { linkedApps: newAppEntry } },
      { new: true },
    );

    if (!story) return res.status(404).json({ error: "Story not found" });
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= RELEASES =================

exports.getAllReleases = async (req, res) => {
  try {
    const releases = await Release.find().sort({ releaseDate: -1 });
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

exports.getReleaseStories = async (req, res) => {
  try {
    const release = await Release.findById(req.params.releaseId);
    if (!release) return res.status(404).json({ error: "Release not found" });

    const stories = await Story.find({ releaseTag: release.name })
      // 👇 NAYA: Yahan select mein linkedApps add kiya
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate releaseTag comments appsToBeDeployed linkedApps status liveEnvRelease",
      )
      // 👇 NAYA: linkedApps ke andar app ka asli naam fetch karne ke liye populate kiya
      .populate("linkedApps.appRef", "name")
      .sort({ createdAt: -1 });

    res.json({ release, stories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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


// ================= GITHUB BRANCH MERGE STATUS =================
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

// ================= GITHUB BRANCH MERGE STATUS (DEBUG VERSION) =================
// exports.getBranchMergeStatus = async (req, res) => {
//   try {
//     const { orgName, repoName, branchName, token } = req.body; 
    
//     // 1. Check karo ki frontend se data aa bhi raha hai ya nahi?
//     console.log("👉 Data received from frontend:", { orgName, repoName, branchName });
//     console.log("👉 Token received:", token ? "YES (Token is present)" : "NO TOKEN!");

//     if (!token) {
//       return res.status(401).json({ error: "GitHub token missing in request body" });
//     }

//     const githubUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?head=${orgName}:${branchName}&state=all`;
//     console.log("👉 Hitting GitHub URL:", githubUrl);
    
//     const githubResponse = await fetch(githubUrl, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Accept': 'application/vnd.github.v3+json'
//       }
//     });

//     // 2. Agar GitHub ne error diya
//     if (!githubResponse.ok) {
//       const errText = await githubResponse.text(); // JSON ki jagah text liya taaki crash na ho
//       console.log("❌ GitHub API Failed! Response:", errText);
//       throw new Error(`GitHub API Error: ${errText}`);
//     }

//     const prs = await githubResponse.json();
//     console.log(`✅ GitHub Success! Found ${prs.length} PRs.`);

//     // 3. Sirf latest merge nikalne ka logic
//     let latestMergeTime = 0; 
//     let latestMergedBranch = "Not Merged"; 

//     prs.forEach(pr => {
//       if (pr.merged_at !== null) {
//         const mergeTime = new Date(pr.merged_at).getTime(); 
//         if (mergeTime > latestMergeTime) {
//           latestMergeTime = mergeTime; 
//           latestMergedBranch = pr.base.ref; 
//         }
//       }
//     });

//     res.status(200).json({
//       branch: branchName,
//       mergedTill: latestMergedBranch 
//     });

//   } catch (err) {
//     // 4. Asli backend error yahan print hoga
//     console.error("🔥 FATAL ERROR in getBranchMergeStatus:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// };