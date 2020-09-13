var createError = require('http-errors');
var express = require('express');
var path = require('path');
var config = require('./config');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var authenticate = require('./authenticate');

var articleRouter = require('./routes/articleRouter');
const uploadRouter = require('./routes/uploadRouter');
const favoriteRouter = require('./routes/favoriteRouter');

const mongoose = require('mongoose');

const Articles = require('./models/articles');
const Favorites = require('./models/favorite');

const url = config.mongoUrl;
const connect = mongoose.connect(url,{ useNewUrlParser: true,useUnifiedTopology: true });
connect.then((db) => {
  console.log("Connected correctly to server");
}, (err) => { console.log(err); });

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const articles = await Articles.find().sort({ createdAt: 'desc' })
  res.render('user/homepage', {articles:articles})
});

app.get('/index', async(req,res)=>{
  const articles = await Articles.find().sort({createdAt:'desc'})
  res.render('admin/index',{articles:articles})
})

app.use('/admin', articleRouter);
app.use('/user', articleRouter);
app.use('/admin/imageUpload',uploadRouter);
app.use('/user/favorites', favoriteRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;
app.listen(5000);

