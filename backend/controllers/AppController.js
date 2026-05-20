const { Story } = require("../models/Model");

exports.getAppStoriesByName = async (req, res) => {
  try {
    // Read route parameter so we can return all stories linked to this app name.
    const { appName } = req.params;

    // Query stories where at least one linked app entry matches the requested app.
    // Select only fields needed by the UI and keep newest stories first.
    const stories = await Story.find({ "linkedApps.appName": appName })
      .select(
        "_id storyId storyName responsibility storyPoints firstReview qaEnvRelDate comments status liveEnvRelease linkedApps.appName"
      )
      .sort({ createdAt: -1 });

    // Return a stable response shape with app metadata and matching stories.
    res.json({
      app: { name: appName },
      stories,
    });
  } catch (err) {
    // Forward unexpected failures as a server error with a readable message.
    res.status(500).json({ error: err.message });
  }
};

exports.getBranchMergeStatus = async (req, res) => {
  try {
    // Read GitHub request parameters sent by frontend.
    const { orgName, repoName, branchName, token } = req.body;

    // Token is required for authenticated GitHub API access.
    if (!token) {
      return res.status(401).json({
        error: "GitHub token missing in request body",
      });
    }

    // Request all pull requests opened from this feature branch.
    const githubUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?head=${orgName}:${branchName}&state=all`;
    const githubResponse = await fetch(githubUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Convert GitHub API failures into a backend error with the upstream reason.
    if (!githubResponse.ok) {
      const errData = await githubResponse.json();
      throw new Error(`GitHub API Error: ${errData.message || "Not Found"}`);
    }

    // Parse PR list and compute latest target branch where this feature got merged.
    const prs = await githubResponse.json();
    let latestMergeTime = 0;
    let latestMergedBranch = "Not Merged";

    prs.forEach((pr) => {
      // Ignore PRs that were closed without merge.
      if (pr.merged_at !== null) {
        const mergeTime = new Date(pr.merged_at).getTime();

        // Keep the most recent merge event and corresponding destination branch.
        if (mergeTime > latestMergeTime) {
          latestMergeTime = mergeTime;
          latestMergedBranch = pr.base.ref;
        }
      }
    });

    // Return the branch and resolved merge destination for UI display.
    res.status(200).json({
      branch: branchName,
      mergedTill: latestMergedBranch,
    });
  } catch (err) {
    console.error("Error fetching branch status:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getBranchExistenceStatus = async (req, res) => {
  try {
    // Read GitHub request parameters sent by frontend.
    const { orgName, repoName, branchName, token } = req.body;

    // Token is required for authenticated GitHub API access.
    if (!token) {
      return res.status(401).json({
        error: "GitHub token missing in request body",
      });
    }

    // Request endpoint for the specific branch to see if it exists.
    const githubUrl = `https://api.github.com/repos/${orgName}/${repoName}/branches/${branchName}`;
    const githubResponse = await fetch(githubUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // A 404 status code means the branch cleanly does not exist.
    if (githubResponse.status === 404) {
      return res.status(200).json({
        branch: branchName,
        exists: false,
      });
    }

    // Convert other GitHub API failures (e.g. 401 Unauthorized, 403 Rate Limit) into a backend error.
    if (!githubResponse.ok) {
      const errData = await githubResponse.json();
      throw new Error(`GitHub API Error: ${errData.message || "An error occurred"}`);
    }

    // If the response is OK (200), the branch exists.
    res.status(200).json({
      branch: branchName,
      exists: true,
    });
  } catch (err) {
    console.error("Error fetching branch existence status:", err);
    res.status(500).json({ error: err.message });
  }
};
