const express = require('express');
const router = express.Router();

const storyRoutes = require('./storyRoutes');
const sprintRoutes = require('./sprintRoutes');
const releaseRoutes = require('./releaseRoutes');
const appRoutes = require('./appRoutes');

router.use(storyRoutes);
router.use(sprintRoutes);
router.use(releaseRoutes);
router.use(appRoutes);

module.exports = router;