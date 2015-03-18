'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Postitem = mongoose.model('Postitem'),
	_ = require('lodash');

/**
 * Create a Postitem
 */
exports.create = function(req, res) {
	var postitem = new Postitem(req.body);
	postitem.user = req.user;

	postitem.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(postitem);
		}
	});
};

/**
 * Show the current Postitem
 */
exports.read = function(req, res) {
	res.jsonp(req.postitem);
};

/**
 * Update a Postitem
 */
exports.update = function(req, res) {
	var postitem = req.postitem ;

	postitem = _.extend(postitem , req.body);

	postitem.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(postitem);
		}
	});
};

/**
 * Delete an Postitem
 */
exports.delete = function(req, res) {
	var postitem = req.postitem ;

	postitem.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(postitem);
		}
	});
};

/**
 * List of Postitems
 */
exports.list = function(req, res) { 
	Postitem.find().sort('-created').populate('user', 'displayName').exec(function(err, postitems) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(postitems);
		}
	});
};

/**
 * Postitem middleware
 */
exports.postitemByID = function(req, res, next, id) { 
	Postitem.findById(id).populate('user', 'displayName').exec(function(err, postitem) {
		if (err) return next(err);
		if (! postitem) return next(new Error('Failed to load Postitem ' + id));
		req.postitem = postitem ;
		next();
	});
};

/**
 * Postitem authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.postitem.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
