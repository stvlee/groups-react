'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Thread = mongoose.model('Thread'),
	_ = require('lodash');



/**
 * Create a Thread
 */
exports.create = function(req, res) {
	var thread = new Thread(req.body);
	thread.user = req.user;

	thread.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(thread);
		}
	});
};

/**
 * Show the current Thread
 */
exports.read = function(req, res) {
	res.jsonp(req.thread);
};

/**
 * Update a Thread
 */
exports.update = function(req, res) {
	var thread = req.thread ;

	thread = _.extend(thread , req.body);

	thread.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(thread);
		}
	});
};

/**
 * Delete an Thread
 */
exports.delete = function(req, res) {
	var thread = req.thread ;

	thread.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(thread);
		}
	});
};

/**
 * List of Threads
 */
exports.list = function(req, res) { 
	Thread.find().sort('-created').populate('user', 'displayName').exec(function(err, threads) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(threads);
		}
	});
};

/**
 * Thread middleware
 */
exports.threadByID = function(req, res, next, id) { 
	Thread.findById(id).populate('user', 'displayName').exec(function(err, thread) {
		if (err) return next(err);
		if (! thread) return next(new Error('Failed to load Thread ' + id));
		req.thread = thread ;
		next();
	});
};

/**
 * Thread authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.thread.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
