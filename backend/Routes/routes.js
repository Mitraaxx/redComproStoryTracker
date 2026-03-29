const express = require('express');
const router = express.Router();

const {
  createStoryEntry,
  getAllStories,
  updateStoryDetails, 
  updateStoryApps,
  getStoryById,
  getAllSprints,
  getSprintStories,
  getAllApps,
  getAppDetails,
  updateSprintDetails,
  createSprint,
  createNewStory,
  addAppToStory,
  getAllReleases,
  createRelease,
  getReleaseStories,
  updateRelease,
  getAppStoriesByName,
  getBranchMergeStatus
} = require('../controllers/controllers');

router.post('/stories', createStoryEntry);

router.get('/stories', getAllStories);
router.get('/stories/:id', getStoryById);

router.get('/sprints', getAllSprints);
router.get('/sprints/:sprintId/stories', getSprintStories);

router.get('/apps', getAllApps);
router.get('/apps/:appId', getAppDetails);

router.put('/sprints/:sprintId', updateSprintDetails);
router.put('/stories/:storyId', updateStoryDetails);
router.put('/stories/:storyId/apps', updateStoryApps);

router.post('/sprints', createSprint);
router.post('/stories/new', createNewStory);
router.post('/stories/:storyId/apps', addAppToStory);

router.get('/releases', getAllReleases);
router.post('/releases', createRelease);
router.get('/releases/:releaseId/stories', getReleaseStories);
router.put('/releases/:releaseId', updateRelease);

router.get('/apps/name/:appName/stories', getAppStoriesByName);

router.post('/github/branch-status', getBranchMergeStatus);

module.exports = router;