const express = require('express');
const router = express.Router();

const {
  getAllSprints,
  getSprintStories,
  updateSprintDetails,
  createSprint
} = require('../controllers/controllers');

router.get('/sprints', getAllSprints);
router.get('/sprints/:sprintId/stories', getSprintStories);
router.put('/sprints/:sprintId', updateSprintDetails);
router.post('/sprints', createSprint);

module.exports = router;