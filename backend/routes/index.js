var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET admin dashboard */
router.get('/admin', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

/* GET analytics dashboard */
router.get('/admin/analytics', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/admin/analytics.html'));
});

/* POST analytics event */
router.post('/analytics', function(req, res, next) {
  const event = req.body;
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  const logPath = path.join(__dirname, '../analytics.log');
  fs.appendFile(logPath, JSON.stringify(logEntry) + '\n', err => {
    if (err) {
      console.error('Failed to log analytics event:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});

module.exports = router;
