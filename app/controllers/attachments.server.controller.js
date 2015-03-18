'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Attachment = mongoose.model('Attachment'),
	_ = require('lodash');

/**
 * Create a Attachment
 */
exports.create = function(req, res) {
	var attachment = new Attachment(req.body);
	attachment.user = req.user;

	attachment.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(attachment);
		}
	});
};

/**
 * Show the current Attachment
 */
exports.read = function(req, res) {
	res.jsonp(req.attachment);
};

/**
 * Update a Attachment
 */
exports.update = function(req, res) {
	var attachment = req.attachment ;

	attachment = _.extend(attachment , req.body);

	attachment.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(attachment);
		}
	});
};

/**
 * Delete an Attachment
 */
exports.delete = function(req, res) {
	var attachment = req.attachment ;

	attachment.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(attachment);
		}
	});
};

/**
 * List of Attachments
 */
exports.list = function(req, res) { 
	Attachment.find().sort('-created').populate('user', 'displayName').exec(function(err, attachments) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(attachments);
		}
	});
};

/**
 * Attachment middleware
 */
exports.attachmentByID = function(req, res, next, id) { 
	Attachment.findById(id).populate('user', 'displayName').exec(function(err, attachment) {
		if (err) return next(err);
		if (! attachment) return next(new Error('Failed to load Attachment ' + id));
		req.attachment = attachment ;
		next();
	});
};

/**
 * Attachment authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.attachment.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
