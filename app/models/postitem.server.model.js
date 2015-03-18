'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Postitem Schema
 */
var PostitemSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Postitem name',
		trim: true
	},
    //T:Text, F:File, P:Pic, S:Sound, V:Video
    type: {
        type: String,
        default: 'T',
        required: 'Please fill postitem type',
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    iconUrl: {
        type: String,
        trim: true
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

mongoose.model('Postitem', PostitemSchema);
