'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Attachment Schema
 */
var AttachmentSchema = new Schema({
	//filename
    name: {
		type: String,
		default: '',
		required: 'Please fill Attachment name',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Attachment', AttachmentSchema);
