const BASE_URL = process.env.REACT_APP_BASE_URL;

let cachedSprintList = null;
let cachedSprintStories = {};
let storyDetailsCache = {};
let cachedStoryList = null;
let cachedReleaseList = null;
let cachedReleaseStories = {};
let cachedAppStories = {};
let cachedBranchStatuses = {};

export const clearAllCaches = () => {
  cachedSprintList = null;
  cachedSprintStories = {};
  storyDetailsCache = {};
  cachedStoryList = null;
  cachedReleaseList = null;
  cachedReleaseStories = {};
  cachedAppStories = {};
  cachedBranchStatuses = {};
};

export const clearGitHubCache = () => {
  cachedBranchStatuses = {};
}

export const fetchAllSprints = async () => {
  try {
    if (cachedSprintList) return cachedSprintList;
    const response = await fetch(`${BASE_URL}/sprints`);
    if (!response.ok) throw new Error("Error in fetching all the sprints");
    const data = await response.json();
    cachedSprintList = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

export const fetchSprintStories = async (sprintId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedSprintStories[sprintId];
    if (cachedSprintStories[sprintId]) return cachedSprintStories[sprintId];

    const response = await fetch(`${BASE_URL}/sprints/${sprintId}/stories`);
    if (!response.ok)
      throw new Error("Error in fetching sprint specific stories");
    const data = await response.json();
    cachedSprintStories[sprintId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

export const fetchStoryDetails = async (storyId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete storyDetailsCache[storyId];
    if (storyDetailsCache[storyId]) {
      console.log("Cached data se aaya!");
      return storyDetailsCache[storyId];
    }

    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    storyDetailsCache[storyId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

export const fetchAllStories = async () => {
  try {
    if (cachedStoryList) return cachedStoryList;
    const response = await fetch(`${BASE_URL}/stories`);
    if (!response.ok) throw new Error("Error in fetching all the stories");
    const data = await response.json();
    cachedStoryList = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

export const updateStory = async (storyId, formData) => {
  try {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error("Story update failed");
    const data = await response.json();
    delete storyDetailsCache[storyId];
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const updateStoryApps = async (storyId, appsData) => {
  try {
    const response = await fetch(`${BASE_URL}/stories/${storyId}/apps`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appsData }),
    });
    if (!response.ok) throw new Error("Apps update failed");
    const data = await response.json();
    delete storyDetailsCache[storyId];
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const updateSprint = async (sprintId, sprintFormData) => {
  try {
    const response = await fetch(`${BASE_URL}/sprints/${sprintId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sprintFormData),
    });
    if (!response.ok) throw new Error("Sprint update failed");
    const data = await response.json();
    delete cachedSprintStories[sprintId];
    return data;
  } catch (err) {
    console.log("API Error:", err);
    throw err;
  }
};

export const createSprint = async (sprintData) => {
  try {
    const response = await fetch(`${BASE_URL}/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sprintData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create sprint");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error in createSprint:", error);
    throw error;
  }
};

export const createStory = async (storyData) => {
  try {
    const response = await fetch(`${BASE_URL}/stories/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storyData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create story");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error in createStory:", error);
    throw error;
  }
};

export const fetchAllReleases = async () => {
  try {
    if (cachedReleaseList) return cachedReleaseList;
    const response = await fetch(`${BASE_URL}/releases`);
    if (!response.ok) throw new Error("Error fetching releases");
    const data = await response.json();
    cachedReleaseList = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

export const createRelease = async (releaseData) => {
  try {
    const response = await fetch(`${BASE_URL}/releases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(releaseData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create release");
    }
    cachedReleaseList = null;
    return await response.json();
  } catch (error) {
    console.error("API Error in createRelease:", error);
    throw error;
  }
};

export const fetchReleaseStories = async (releaseId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedReleaseStories[releaseId];
    if (cachedReleaseStories[releaseId]) return cachedReleaseStories[releaseId];

    const response = await fetch(`${BASE_URL}/releases/${releaseId}/stories`);
    if (!response.ok)
      throw new Error("Error in fetching release specific stories");
    const data = await response.json();
    cachedReleaseStories[releaseId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

export const updateRelease = async (releaseId, releaseData) => {
  try {
    const response = await fetch(`${BASE_URL}/releases/${releaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(releaseData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Release update failed");
    }
    cachedReleaseList = null;
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const fetchAppStories = async (appName, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedAppStories[appName];
    if (cachedAppStories[appName]) return cachedAppStories[appName];

    const response = await fetch(`${BASE_URL}/apps/name/${appName}/stories`);
    if (!response.ok) throw new Error("Error fetching app stories");
    const data = await response.json();
    cachedAppStories[appName] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

export const fetchBranchMergeStatus = async (
  orgName,
  repoName,
  branchName,
  forceRefresh = false,
) => {
  const cacheKey = `${orgName}-${repoName}-${branchName}`;

  try {
    if (forceRefresh) delete cachedBranchStatuses[cacheKey];

    if (cachedBranchStatuses[cacheKey]) {
      return cachedBranchStatuses[cacheKey];
    }

    const token = localStorage.getItem("github_pat");

    if (!token) {
      return { mergedTill: "Add Token" };
    }

    const response = await fetch(`${BASE_URL}/github/branch-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ orgName, repoName, branchName, token }), 
    });

    if (!response.ok) throw new Error("Failed to fetch merge status");

    const data = await response.json();
    cachedBranchStatuses[cacheKey] = data;

    return data;
  } catch (error) {
    console.error("API Error in fetchBranchMergeStatus:", error);
    return { mergedTill: "Error" };
  }
};