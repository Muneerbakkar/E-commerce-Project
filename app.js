var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var swal = require('sweetalert2')
require('dotenv').config();


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars');
var Handlebars = require('handlebars');


var app = express();
// var fileUpload=require('express-fileupload')
var db = require('./config/connection')
var session = require('express-session')
var ConnectMongoDBSession = require("connect-mongodb-session");
var mongoDbSesson = new ConnectMongoDBSession(session);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'userlayout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }))
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(fileUpload())
app.use(session({secret:"key",cookie:{maxAge:6000000}}))
// app.use(
//   session({
//     secret: "key",
//     cookie: { maxAge: 6000000 },
//     resave: true,
//     store: new mongoDbSesson({
//       uri: "mongodb://localhost:27017",
//       collection: "session",
//     }),
//     saveUninitialized: true,
//   })
// );

db.connect((err) => {
  if (err) console.log("Connection Error" + err);
  else console.log("Database Connected to port 27017");
})

Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

Handlebars.registerHelper('ifCheck', function (value1, value2, options) {
  if (value1 === value2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
