var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
const apiRouter = require('./src/api');

var app = express();

// Enable CORS for all routes
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

// Print all registered routes for debugging
function printRoutes(stack, prefix = '') {
  stack.forEach(function(layer) {
    if (layer.route && layer.route.path) {
      console.log(prefix + layer.route.path);
    } else if (layer.name === 'router' && layer.handle.stack) {
      printRoutes(layer.handle.stack, prefix + (layer.regexp && layer.regexp.source !== '^\\/?$' ? layer.regexp.source : ''));
    }
  });
}
printRoutes(app._router.stack);

app.get('/products-admin', (req, res, next) => {
  if (req.hostname === 'transpareneats-api.onrender.com') {
    return res.redirect('https://transpareneats.onrender.com/products-admin');
  }
  next();
});

module.exports = app;
