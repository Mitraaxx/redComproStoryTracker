const BASE_URL = process.env.REACT_APP_BASE_URL;

let cachedSprintList = null;
let cachedSprintStories = {};
let storyDetailsCache = {};
let cachedStoryList = null;
let cachedReleaseList = null;
let cachedReleaseStories = {};
let cachedAppStories = {};
let cachedBranchStatuses = {};

/**
 * Clears all in-memory caches. 
 * Useful when a major update occurs and the app needs to fetch fresh data across all screens.
 */
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

/**
 * Clears only the GitHub branch merge status cache.
 * Useful when user wants to manually refresh branch statuses without affecting sprint/story data.
 */
export const clearGitHubCache = () => {
  cachedBranchStatuses = {};
}

/**
 * Core helper function that wraps standard 'fetch'.
 * Automatically retrieves the Clerk session token and attaches it to the 'Authorization' header for secure API calls.
 */
const fetchWithAuth = async (url, options = {}) => {
  let token = null;
  
  if (window.Clerk && window.Clerk.session) {
    token = await window.Clerk.session.getToken();
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

/**
 * Fetches the list of all available sprints.
 * Returns cached data if available to reduce network requests.
 */
export const fetchAllSprints = async () => {
  try {
    if (cachedSprintList) return cachedSprintList;
    const response = await fetchWithAuth(`${BASE_URL}/sprints`);
    if (!response.ok) throw new Error("Error in fetching all the sprints");
    const data = await response.json();
    cachedSprintList = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

/**
 * Fetches all stories associated with a specific sprint ID.
 */
export const fetchSprintStories = async (sprintId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedSprintStories[sprintId];
    if (cachedSprintStories[sprintId]) return cachedSprintStories[sprintId];

    const response = await fetchWithAuth(`${BASE_URL}/sprints/${sprintId}/stories`);
    if (!response.ok)
      throw new Error("Error in fetching sprint specific stories");
    const data = await response.json();
    cachedSprintStories[sprintId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

/**
 * Retrieves the comprehensive details of a single story using its story ID.
 * Returns cached details if previously fetched, unless 'forceRefresh' is true.
 */
export const fetchStoryDetails = async (storyId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete storyDetailsCache[storyId];
    if (storyDetailsCache[storyId]) {
      return storyDetailsCache[storyId];
    }

    const response = await fetchWithAuth(`${BASE_URL}/stories/${storyId}`);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    storyDetailsCache[storyId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

/**
 * Fetches a complete list of all stories across the entire application.
 * Utilizes caching to prevent redundant data loading.
 */
export const fetchAllStories = async () => {
  try {
    if (cachedStoryList) return cachedStoryList;
    const response = await fetchWithAuth(`${BASE_URL}/stories`);
    if (!response.ok) throw new Error("Error in fetching all the stories");
    const data = await response.json();
    cachedStoryList = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

/**
 * Updates the basic metadata (name, points, dates, etc.) of an existing story.
 * Invalidates the specific story's cache upon a successful update.
 */
export const updateStory = async (storyId, formData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/stories/${storyId}`, {
      method: "PUT",
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

/**
 * Updates only the linked applications and feature branches for a specific story.
 * Invalidates the story's cache upon a successful update.
 */
export const updateStoryApps = async (storyId, appsData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/stories/${storyId}/apps`, {
      method: "PUT",
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

/**
 * Updates the details of a specific sprint (e.g., name, dates, notes).
 * Clears the cached stories for that sprint to ensure UI consistency.
 */
export const updateSprint = async (sprintId, sprintFormData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/sprints/${sprintId}`, {
      method: "PUT",
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

/**
 * Creates a new sprint entry in the database.
 */
export const createSprint = async (sprintData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/sprints`, {
      method: "POST",
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

/**
 * Creates a new story entry in the database.
 */
export const createStory = async (storyData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/stories/new`, {
      method: "POST",
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

/**
 * Fetches all release records (e.g., Release 1.0, Release 2.0) from the backend.
 * Returns cached data if it has been fetched previously.
 */
export const fetchAllReleases = async () => {
  try {
    if (cachedReleaseList) return cachedReleaseList;
    const response = await fetchWithAuth(`${BASE_URL}/releases`);
    if (!response.ok) throw new Error("Error fetching releases");
    const data = await response.json();
    cachedReleaseList = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

/**
 * Creates a new release entry in the database.
 * Invalidates the global release list cache so the new release appears immediately.
 */
export const createRelease = async (releaseData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/releases`, {
      method: "POST",
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

/**
 * Retrieves all stories associated with a specific release ID.
 */
export const fetchReleaseStories = async (releaseId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedReleaseStories[releaseId];
    if (cachedReleaseStories[releaseId]) return cachedReleaseStories[releaseId];

    const response = await fetchWithAuth(`${BASE_URL}/releases/${releaseId}/stories`);
    if (!response.ok)
      throw new Error("Error in fetching release specific stories");
    const data = await response.json();
    cachedReleaseStories[releaseId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

/**
 * Updates an existing release's metadata (e.g., target dates, name, category).
 * Clears the release cache upon completion.
 */
export const updateRelease = async (releaseId, releaseData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/releases/${releaseId}`, {
      method: "PUT",
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

/**
 * Retrieves all stories linked to a specific application or repository name (e.g., 'frontend').
 * Uses caching to prevent redundant data fetching.
 */
export const fetchAppStories = async (appName, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedAppStories[appName];
    if (cachedAppStories[appName]) return cachedAppStories[appName];

    const response = await fetchWithAuth(`${BASE_URL}/apps/name/${appName}/stories`);
    if (!response.ok) throw new Error("Error fetching app stories");
    const data = await response.json();
    cachedAppStories[appName] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

/**
 * Queries the backend (which in turn queries GitHub) to determine the latest merge status of a feature branch.
 * Requires a personal GitHub token stored in the user's localStorage. Results are heavily cached per branch.
 */
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

    const response = await fetchWithAuth(`${BASE_URL}/github/branch-status`, {
      method: "POST",
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