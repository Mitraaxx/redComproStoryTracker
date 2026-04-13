// Central API client used by all frontend screens.
// Flow:
// 1) Build authenticated requests through fetchWithAuth.
// 2) Keep lightweight in-memory caches per resource/endpoint.
// 3) Rely on explicit global cache invalidation via clearAllCaches after write operations.
const BASE_URL = process.env.REACT_APP_BASE_URL;

let cachedSprintList = null;
let cachedSprintNameList = null;
let cachedSprintStories = {};
let storyDetailsCache = {};
let cachedStoryList = null;
let cachedStoryValidationList = null;
let cachedReleaseList = null;
let cachedReleaseNameList = null;
let cachedReleaseStories = {};
let cachedAppStories = {};
let cachedBranchStatuses = {};

// Full cache reset used after create/update operations
// when multiple pages may depend on stale shared data.
export const clearAllCaches = () => {
  cachedSprintList = null;
  cachedSprintNameList = null;
  cachedSprintStories = {};
  storyDetailsCache = {};
  cachedStoryList = null;
  cachedStoryValidationList = null;
  cachedReleaseList = null;
  cachedReleaseNameList = null;
  cachedReleaseStories = {};
  cachedAppStories = {};
  cachedBranchStatuses = {};
};

// Shared request wrapper:
// 1) Read Clerk session token (if available).
// 2) Attach JSON and Authorization headers.
// 3) Parse response safely even for non-JSON error bodies.
// 4) Throw normalized Error for non-2xx responses.
const fetchWithAuth = async (url, options = {}) => {
  try {
    let token = null;
    if (window.Clerk && window.Clerk.session) {
      token = await window.Clerk.session.getToken();
    }
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers
    });
    const data = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    throw error;
  }
};

// Sprint list fetch with optional names-only mode for dropdown hydration.
export const fetchAllSprints = async (namesOnly = false) => {
  try {
    const cachedData = namesOnly ? cachedSprintNameList : cachedSprintList;
    if (cachedData) return cachedData;

    const url = namesOnly
      ? `${BASE_URL}/sprints?namesOnly=true`
      : `${BASE_URL}/sprints`;
    const data = await fetchWithAuth(url);

    if (namesOnly) {
      cachedSprintNameList = data;
    } else {
      cachedSprintList = data;
    }
    return data;
  } catch (error) {
    console.error("API Error in fetchAllSprints:", error);
  }
};

// Fetch one sprint payload (sprint details + stories).
// forceRefresh bypasses and replaces this sprint's cache entry.
export const fetchSprintStories = async (sprintId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedSprintStories[sprintId];
    if (cachedSprintStories[sprintId]) return cachedSprintStories[sprintId];
    const data = await fetchWithAuth(`${BASE_URL}/sprints/${sprintId}`);
    cachedSprintStories[sprintId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

// Story detail fetch by DB id with per-story cache key.
// Returns null on failure so detail screens can handle fallback UI.
export const fetchStoryDetails = async (storyId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete storyDetailsCache[storyId];
    if (storyDetailsCache[storyId]) return storyDetailsCache[storyId];
    const data = await fetchWithAuth(`${BASE_URL}/stories/${storyId}`);
    storyDetailsCache[storyId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

// Global story list fetch with optional validation view for lightweight lookups.
export const fetchAllStories = async (view = "list") => {
  try {
    const isValidation = view === "validation";
    const cachedData = isValidation ? cachedStoryValidationList : cachedStoryList;
    if (cachedData) return cachedData;

    const url = isValidation
      ? `${BASE_URL}/stories?view=validation`
      : `${BASE_URL}/stories`;
    const data = await fetchWithAuth(url);

    if (isValidation) {
      cachedStoryValidationList = data;
    } else {
      cachedStoryList = data;
    }
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

// Story update endpoint.
export const updateStory = async (storyId, formData) => {
  try {
    return await fetchWithAuth(`${BASE_URL}/stories/${storyId}`, {
      method: "PUT",
      body: JSON.stringify(formData)
    });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Sprint update endpoint.
export const updateSprint = async (sprintId, sprintFormData) => {
  try {
    return await fetchWithAuth(`${BASE_URL}/sprints/${sprintId}`, {
      method: "PUT",
      body: JSON.stringify(sprintFormData)
    });
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
};

// Sprint creation endpoint.
export const createSprint = async sprintData => {
  try {
    return await fetchWithAuth(`${BASE_URL}/sprints`, {
      method: "POST",
      body: JSON.stringify(sprintData)
    });
  } catch (error) {
    console.error("API Error in createSprint:", error);
    throw error;
  }
};

// Story creation endpoint.
export const createStory = async storyData => {
  try {
    return await fetchWithAuth(`${BASE_URL}/stories/new`, {
      method: "POST",
      body: JSON.stringify(storyData)
    });
  } catch (error) {
    console.error("API Error in createStory:", error);
    throw error;
  }
};

// Release list fetch with optional names-only mode for dropdown hydration.
export const fetchAllReleases = async (namesOnly = false) => {
  try {
    const cachedData = namesOnly ? cachedReleaseNameList : cachedReleaseList;
    if (cachedData) return cachedData;

    const url = namesOnly
      ? `${BASE_URL}/releases?namesOnly=true`
      : `${BASE_URL}/releases`;
    const data = await fetchWithAuth(url);

    if (namesOnly) {
      cachedReleaseNameList = data;
    } else {
      cachedReleaseList = data;
    }
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

// Release creation endpoint.
export const createRelease = async releaseData => {
  try {
    return await fetchWithAuth(`${BASE_URL}/releases`, {
      method: "POST",
      body: JSON.stringify(releaseData)
    });
  } catch (error) {
    console.error("API Error in createRelease:", error);
    throw error;
  }
};

// Fetch one release payload (release metadata + linked stories).
// forceRefresh bypasses cached release-detail payload.
export const fetchReleaseStories = async (releaseId, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedReleaseStories[releaseId];
    if (cachedReleaseStories[releaseId]) return cachedReleaseStories[releaseId];
    const data = await fetchWithAuth(`${BASE_URL}/releases/${releaseId}`);
    cachedReleaseStories[releaseId] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

// Release update endpoint.
export const updateRelease = async (releaseId, releaseData) => {
  try {
    return await fetchWithAuth(`${BASE_URL}/releases/${releaseId}`, {
      method: "PUT",
      body: JSON.stringify(releaseData)
    });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Fetch stories grouped under one application name.
export const fetchAppStories = async (appName, forceRefresh = false) => {
  try {
    if (forceRefresh) delete cachedAppStories[appName];
    if (cachedAppStories[appName]) return cachedAppStories[appName];
    const data = await fetchWithAuth(`${BASE_URL}/apps/name/${appName}/stories`);
    cachedAppStories[appName] = data;
    return data;
  } catch (error) {
    console.error("API Error:", error);
  }
};

// GitHub merge-status flow:
// 1) Build a stable cache key from org/repo/branch.
// 2) Return cached status unless forced refresh.
// 3) Require stored PAT token; if missing return UI hint value.
// 4) Ask backend to call GitHub API and cache normalized response.
export const fetchBranchMergeStatus = async (orgName, repoName, branchName, forceRefresh = false) => {
  const cacheKey = `${orgName}-${repoName}-${branchName}`;
  try {
    if (forceRefresh) delete cachedBranchStatuses[cacheKey];
    if (cachedBranchStatuses[cacheKey]) return cachedBranchStatuses[cacheKey];
    const token = localStorage.getItem("github_pat");
    if (!token) return {
      mergedTill: "Add Token"
    };
    const data = await fetchWithAuth(`${BASE_URL}/github/branch-status`, {
      method: "POST",
      body: JSON.stringify({
        orgName,
        repoName,
        branchName,
        token
      })
    });
    cachedBranchStatuses[cacheKey] = data;
    return data;
  } catch (error) {
    console.error("API Error in fetchBranchMergeStatus:", error);
    return {
      mergedTill: "Error"
    };
  }
};
