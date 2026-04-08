const express = require('express');
const router = express.Router();

const {
  getAppStoriesByName,
  getBranchMergeStatus
} = require('../controllers/controllers');

router.get('/apps/name/:appName/stories', getAppStoriesByName);
router.post('/github/branch-status', getBranchMergeStatus); 

module.exports = router;