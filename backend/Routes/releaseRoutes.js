const express = require('express');
const router = express.Router();

const {
  getAllReleases,
  createRelease,
  getReleaseStories,
  updateRelease
} = require('../controllers/controllers');

router.get('/releases', getAllReleases);
router.post('/releases', createRelease);
router.get('/releases/:releaseId/stories', getReleaseStories);
router.put('/releases/:releaseId', updateRelease);

module.exports = router;