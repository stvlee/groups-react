'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Attachment = mongoose.model('Attachment'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, attachment;

/**
 * Attachment routes tests
 */
describe('Attachment CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user to the test db and create new Attachment
		user.save(function() {
			attachment = {
				name: 'Attachment Name'
			};

			done();
		});
	});

	it('should be able to save Attachment instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Attachment
				agent.post('/attachments')
					.send(attachment)
					.expect(200)
					.end(function(attachmentSaveErr, attachmentSaveRes) {
						// Handle Attachment save error
						if (attachmentSaveErr) done(attachmentSaveErr);

						// Get a list of Attachments
						agent.get('/attachments')
							.end(function(attachmentsGetErr, attachmentsGetRes) {
								// Handle Attachment save error
								if (attachmentsGetErr) done(attachmentsGetErr);

								// Get Attachments list
								var attachments = attachmentsGetRes.body;

								// Set assertions
								(attachments[0].user._id).should.equal(userId);
								(attachments[0].name).should.match('Attachment Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Attachment instance if not logged in', function(done) {
		agent.post('/attachments')
			.send(attachment)
			.expect(401)
			.end(function(attachmentSaveErr, attachmentSaveRes) {
				// Call the assertion callback
				done(attachmentSaveErr);
			});
	});

	it('should not be able to save Attachment instance if no name is provided', function(done) {
		// Invalidate name field
		attachment.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Attachment
				agent.post('/attachments')
					.send(attachment)
					.expect(400)
					.end(function(attachmentSaveErr, attachmentSaveRes) {
						// Set message assertion
						(attachmentSaveRes.body.message).should.match('Please fill Attachment name');
						
						// Handle Attachment save error
						done(attachmentSaveErr);
					});
			});
	});

	it('should be able to update Attachment instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Attachment
				agent.post('/attachments')
					.send(attachment)
					.expect(200)
					.end(function(attachmentSaveErr, attachmentSaveRes) {
						// Handle Attachment save error
						if (attachmentSaveErr) done(attachmentSaveErr);

						// Update Attachment name
						attachment.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Attachment
						agent.put('/attachments/' + attachmentSaveRes.body._id)
							.send(attachment)
							.expect(200)
							.end(function(attachmentUpdateErr, attachmentUpdateRes) {
								// Handle Attachment update error
								if (attachmentUpdateErr) done(attachmentUpdateErr);

								// Set assertions
								(attachmentUpdateRes.body._id).should.equal(attachmentSaveRes.body._id);
								(attachmentUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Attachments if not signed in', function(done) {
		// Create new Attachment model instance
		var attachmentObj = new Attachment(attachment);

		// Save the Attachment
		attachmentObj.save(function() {
			// Request Attachments
			request(app).get('/attachments')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Attachment if not signed in', function(done) {
		// Create new Attachment model instance
		var attachmentObj = new Attachment(attachment);

		// Save the Attachment
		attachmentObj.save(function() {
			request(app).get('/attachments/' + attachmentObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', attachment.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Attachment instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Attachment
				agent.post('/attachments')
					.send(attachment)
					.expect(200)
					.end(function(attachmentSaveErr, attachmentSaveRes) {
						// Handle Attachment save error
						if (attachmentSaveErr) done(attachmentSaveErr);

						// Delete existing Attachment
						agent.delete('/attachments/' + attachmentSaveRes.body._id)
							.send(attachment)
							.expect(200)
							.end(function(attachmentDeleteErr, attachmentDeleteRes) {
								// Handle Attachment error error
								if (attachmentDeleteErr) done(attachmentDeleteErr);

								// Set assertions
								(attachmentDeleteRes.body._id).should.equal(attachmentSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Attachment instance if not signed in', function(done) {
		// Set Attachment user 
		attachment.user = user;

		// Create new Attachment model instance
		var attachmentObj = new Attachment(attachment);

		// Save the Attachment
		attachmentObj.save(function() {
			// Try deleting Attachment
			request(app).delete('/attachments/' + attachmentObj._id)
			.expect(401)
			.end(function(attachmentDeleteErr, attachmentDeleteRes) {
				// Set message assertion
				(attachmentDeleteRes.body.message).should.match('User is not logged in');

				// Handle Attachment error error
				done(attachmentDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Attachment.remove().exec();
		done();
	});
});