const express = require('express');
const router = express.Router();

const {
  getAllStories,
  getStoryById,
  updateStoryDetails,
  updateStoryApps,
  createNewStory,
} = require('../controllers/controllers');

router.get('/stories', getAllStories);
router.get('/stories/:id', getStoryById);
router.put('/stories/:storyId', updateStoryDetails);
router.put('/stories/:storyId/apps', updateStoryApps);
router.post('/stories/new', createNewStory);

module.exports = router;