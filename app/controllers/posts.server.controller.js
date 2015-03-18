'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Crawler = require('crawler'),
  chalk = require('chalk'),
  url = require('url'),
  errorHandler = require('./errors.server.controller'),
  Post = mongoose.model('Post'),
  _ = require('lodash');


var crawlFreedl = function (page) {
  var crawler = new Crawler({
    maxConnections: 1,
    forceUTF8: true
  });

  var cb = function (error, result, $) {
    $('table.brdr').each(function (index, a) {
        //var img = baseUrl + $(a).find('td.bgb').attr('src');
        var url = baseUrl + $(a).find('td.bgb a').attr('href');
        var subject = $(a).find('td.bgb font').text();
        var date = ($(a).find('td.bgc tt').text().split('Date:')[1]);
        var content = $(a).find('td.bgc blockquote').html();
        var thumbUrl = $(a).find('td.bgc blockquote a').first().attr('href');
        var attnm = $(a).find('td.bgc blockquote a').last().attr('href');

        if (attnm) {
          //console.log('curpage:'+i);
          //console.log('date:'+date.trim());
          //console.log('url:'+url);
          //console.log('subject:'+subject);
          //console.log('content:'+content);
          //console.log('attnm:'+attnm);

          var post = new Post();
          post.subject = subject;
          post.created = new Date('2015/' + date.trim());
          post.thumbUrl = thumbUrl;
          post.content = content;

          post.save(function (err) {
            if (err) {
              console.error(chalk.red(errorHandler.getErrorMessage(err)));
            } else {
              console.log(chalk.green('saved subject:' + subject));
            }
          });
        }
      }
    );
    console.log('Grabbed page: ', page, ' ', result.body.length, 'bytes');
  };

  var baseUrl = 'http://www.freedl.org/treebbs2rss/treebbs2rss/';
  for (var i = 0; i < page; i++) {
    var curpage = i + 1;
    crawler.queue([{
      uri: ('http://www.freedl.org/treebbs2rss/treebbs2rss/tree.php?mode=dump&page=' + curpage),
      callback: cb
    }]);

  }
};

var crawlHkepc = function (page) {
  var crawler = new Crawler({
    maxConnections: 1
  });

  var cb = function (error, result, $) {
    if (error) {
      console.error(chalk.red('Crawl error: ', error));
    } else {
      $('[id^=normalthread]').each(function (index, a) {
          //console.log('subject:' + $(a).find('a').text());
          //console.log('img:http://www.hkepc.com/forum/' + $(a).find('img').attr('src'));
          var baseUrl = 'http://www.hkepc.com/forum/';
          var subject = $(a).find('.subject a').text();
          var img = baseUrl + $(a).find('img').attr('src');
          var href = baseUrl + $(a).find('a').attr('href');

          //console.log('url:http://www.hkepc.com/forum/' +$(a).find('a').attr('href'));


          var post = new Post();
          post.subject = subject;
          //post.created = new Date('2015/' + date.trim());
          post.thumbUrl = href;
          //post.content = content;

          post.save(function (err) {
            if (err) {
              console.error(chalk.red(errorHandler.getErrorMessage(err)));
            } else {
              console.log(chalk.green('saved subject:' + subject));
            }
          });


        }
      );
    }
  }


  var baseUrl = 'http://www.hkepc.com/forum/';
  for (var i = 0; i < page; i++) {
    var curpage = i + 1;
    console.log(chalk.green('saved subject:' + curpage));

    crawler.queue([{
      uri: (baseUrl + 'forumdisplay.php?fid=26&page=' + curpage),
      callback: cb
    }]);
  }
};

/**
 * Crawl
 */
exports.crawlFreedl = function (req, res) {
  console.log(chalk.green('Start crawl...'));

  crawlFreedl(req.query.page);

  res.send('<p>Started</p>');
  //return res.status(200);
};

exports.crawlHkepc = function (req, res) {
  console.log(chalk.green('Start crawl...'));

  crawlHkepc(req.query.page);

  res.send('<p>Started</p>');
  //return res.status(200);
};

/**
 * Create a Post
 */
exports.create = function (req, res) {
  var post = new Post(req.body);
  post.user = req.user;

  post.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(post);
    }
  });
};

/**
 * Show the current Post
 */
exports.read = function (req, res) {
  res.jsonp(req.post);
};

/**
 * Update a Post
 */
exports.update = function (req, res) {
  var post = req.post;

  post = _.extend(post, req.body);

  post.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(post);
    }
  });
};

/**
 * Delete an Post
 */
exports.delete = function (req, res) {
  var post = req.post;

  post.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(post);
    }
  });
};

/**
 * Clean
 */
exports.clean = function (req, res) {
  Post.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      //res.jsonp(post);
      res.send('<p>clean finished</p>');
    }
  });
};

/**
 * List of Posts
 */
exports.list = function (req, res) {
  Post.find().sort('-created').populate('user', 'displayName').exec(function (err, posts) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(posts);
    }
  });
};

/**
 * Post middleware
 */
exports.postByID = function (req, res, next, id) {
  Post.findById(id).populate('user', 'displayName').exec(function (err, post) {
    if (err) return next(err);
    if (!post) return next(new Error('Failed to load Post ' + id));
    req.post = post;
    next();
  });
};

/**
 * Post authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
  if (req.post.user.id !== req.user.id) {
    return res.status(403).send('User is not authorized');
  }
  next();
};
