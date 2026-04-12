const express = require('express');

// Create isolated router instance mounted under /api in server.js.
const router = express.Router();

// Import story handlers.
const {
  getStories,
  updateStoryDetails,
  createNewStory
} = require('../controllers/storiesController');

// Import sprint handlers.
const {
  getSprints,
  updateSprintDetails,
  createSprint
} = require('../controllers/sprintsController');

// Import release handlers.
const {
  getReleases,
  createRelease,
  updateRelease
} = require('../controllers/releaseController');

// Import app and GitHub status handlers.
const {
  getAppStoriesByName,
  getBranchMergeStatus
} = require('../controllers/appController');

// Story routes
// 1) list all stories
// 2) get one story by DB id
// 3) update by business id (storyId)
// 4) create new story
router.get('/stories', getStories);
router.get('/stories/:id', getStories);
router.put('/stories/:storyId', updateStoryDetails);
router.post('/stories/new', createNewStory);

// Sprint routes
// 1) list all sprints
// 2) sprint detail + its stories
// 3) partial sprint update
// 4) create sprint
router.get('/sprints', getSprints);
router.get('/sprints/:sprintId', getSprints);
router.put('/sprints/:sprintId', updateSprintDetails);
router.post('/sprints', createSprint);

// Release routes
// 1) list releases
// 2) create release
// 3) release detail + tagged stories
// 4) update release and cascade tag when needed
router.get('/releases', getReleases);
router.post('/releases', createRelease);
router.get('/releases/:releaseId', getReleases);
router.put('/releases/:releaseId', updateRelease);

// App/GitHub utility routes
// 1) stories by app name
// 2) branch merge status via GitHub API
router.get('/apps/name/:appName/stories', getAppStoriesByName);
router.post('/github/branch-status', getBranchMergeStatus);

// Export router for mounting in main server.
module.exports = router;
