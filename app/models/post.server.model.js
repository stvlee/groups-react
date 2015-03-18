'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Post Schema
 */
var PostSchema = new Schema({
    /**
    thread: {
        type: Schema.ObjectId,
        ref: 'Thread'
    },
    forum: {
        type: Schema.ObjectId,
        ref: 'Forum'
    },
     name: {
        type: String,
        default: '',
        required: 'Please fill Post name',
        trim: true
    },
     **/
    type: {
        type: String,
        default: 'P',
        required: 'Please fill post type',
        trim: true
    },
    subject: {
        type: String,
        default: '',
        required: 'Please fill Subject',
        trim: true
    },
    content: {
        type: String
    },
    description: {
        type: String
    },
    position: {
        type: Number,
        default: 0
    },
    thumbUrl: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    items: {
        type: Schema.ObjectId,
        ref: 'Postitem'
    },
    updated: {
        type: Date,
        default: Date.now
    },
    created: {
        type: Date,
        default: Date.now
    },
    //author
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

mongoose.model('Post', PostSchema);
