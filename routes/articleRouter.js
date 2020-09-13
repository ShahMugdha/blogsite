const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');
var authenticate = require('../authenticate');
const Articles = require('../models/articles');
var passport = require('passport');
const articleRouter = express.Router();
var User = require('../models/user');

articleRouter.use(bodyParser.json());
articleRouter.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
articleRouter.get('/posts/:articleId',async(req,res)=>{
  const article = await Articles.findById(req.params.articleId)
  .then((article) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(article);
   }, (err) => next(err))
   .catch((err) => next(err));
});
  
articleRouter.get('/profile', authenticate.verifyUser, verifyToken, (req,res)=>{
  
  jwt.verify(req.token, 'secretKey',(err)=>{
    if(err) res.sendStatus(403);
  })
  User.find({})
  .populate('comments.author')
  .then((user) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Authorization', 'bearer ${data.jwtToken}');
    res.json(user);
  }, (err) => next(err))
  .catch((err) => next(err));
  res.send(user);
});
  
articleRouter.get('/posts/:articleId/comments',async(req,res)=>{
  const article = await Articles.findById(req.params.articleId)
  .populate('comments.author')
    .then((article) => {
        if (article != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(article.comments);
        }
        else {
            err = new Error('Article ' + req.params.articleId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
  res.render('user/make_comment', {article: article});
});
  
articleRouter.post('/:articleId/comments', authenticate.verifyUser, (req,res,next)=>{
  Articles.findById(req.params.articleId)
  .then((article) => {
    if (article != null) {
      req.body.author = req.user._id;
      article.comments.push(req.body);
      article.save()
      .then((article) => {
        Articles.findById(article._id)
        .populate('comments.author')
        .then((article) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(article);
        })              
       }, (err) => next(err));
    }
    else {
        err = new Error('Article ' + req.params.articleId + ' not found');
        err.status = 404;
        return next(err);
    }
  }, (err) => next(err))
    .catch((err) => next(err));
});
  
articleRouter.get('/index', authenticate.verifyUser, authenticate.verifyAdmin, async(req,res,next)=>{
  const articles = await Articles.find();
  Articles.find(req.query)
  .populate('comments.author')
  .then((articles) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(articles);
  }, (err) => next(err))
  .catch((err) => next(err));
});
  
articleRouter.get('/comment/:articleId', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  Articles.findById(req.params.articleId)
  .populate('comments.author')
  .then((article) => {
      if (article != null) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(article.comments);
        res.render('admin/comment', {article: article})
      }
      else {
        err = new Error('Article ' + req.params.articleId + ' not found');
        err.status = 404;
        return next(err);
      }
    }, (err) => next(err))
    .catch((err) => next(err));
});

articleRouter.post('/login', cors.corsWithOptions, (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});          
      }

      var token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Login Successful!', token: token});
    }); 
  }) (req, res, next);
});
  
articleRouter.post('/signup', cors.corsWithOptions, (req, res, next) => {
    User.register(new User({username: req.body.username}), 
      req.body.password, (err, user) => {
      if(err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
      }
      else {
        if (req.body.firstname)
          user.firstname = req.body.firstname;
        if (req.body.lastname)
          user.lastname = req.body.lastname;
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
            return ;
          }
          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, status: 'Registration Successful!'});
          });
        });
      }
    });
});
  
articleRouter.post('/signin', cors.corsWithOptions, (req, res, next) => {
  
    passport.authenticate('local', (err, user, info) => {
      if (err)
        return next(err);
  
      if (!user) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: info});
      }
      req.logIn(user, (err) => {
        if (err) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});          
        }
  
        var token = authenticate.getToken({_id: req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Login Successful!', token: token});
      }); 
    }) (req, res, next);
});
  
articleRouter.post('/', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Articles.create(req.body)
    .then((article) => {
        console.log('Article Created ', article);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(article);
    }, (err) => next(err))
    .catch((err) => next(err));
});
  
articleRouter.put('/:articleId',cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  Articles.findByIdAndUpdate(req.params.articleId, {
      $set: req.body
  }, { new: true })
  .then((article) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(article);
  }, (err) => next(err))
  .catch((err) => next(err));
})
  
articleRouter.delete('/:articleId', authenticate.verifyUser, authenticate.verifyAdmin, async (req, res) => {
    await Articles.findByIdAndDelete(req.params.articleId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
    res.redirect('/')
});
  
articleRouter.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
      if (err)
        return next(err);
      
      if (!user) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.json({status: 'JWT invalid!', success: false, err: info});
      }
      else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({status: 'JWT valid!', success: true, user: user});
  
      }
    }) (req, res);
});

function verifyToken(req,res,next){
  const bearerHeader = req.headers['authorization'];
  if(typeof bearerHeader!=='undefined'){
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else{
    res.sendStatus(403);
  }
}

module.exports = articleRouter;
