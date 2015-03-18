'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Thread Schema
 */
var ThreadSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Thread name',
		trim: true
	},
    posts: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    updated: {
        type: Date,
        default: Date.now
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

mongoose.model('Thread', ThreadSchema);
