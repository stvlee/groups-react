'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Postitem = mongoose.model('Postitem'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, postitem;

/**
 * Postitem routes tests
 */
describe('Postitem CRUD tests', function() {
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

		// Save a user to the test db and create new Postitem
		user.save(function() {
			postitem = {
				name: 'Postitem Name'
			};

			done();
		});
	});

	it('should be able to save Postitem instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Postitem
				agent.post('/postitems')
					.send(postitem)
					.expect(200)
					.end(function(postitemSaveErr, postitemSaveRes) {
						// Handle Postitem save error
						if (postitemSaveErr) done(postitemSaveErr);

						// Get a list of Postitems
						agent.get('/postitems')
							.end(function(postitemsGetErr, postitemsGetRes) {
								// Handle Postitem save error
								if (postitemsGetErr) done(postitemsGetErr);

								// Get Postitems list
								var postitems = postitemsGetRes.body;

								// Set assertions
								(postitems[0].user._id).should.equal(userId);
								(postitems[0].name).should.match('Postitem Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Postitem instance if not logged in', function(done) {
		agent.post('/postitems')
			.send(postitem)
			.expect(401)
			.end(function(postitemSaveErr, postitemSaveRes) {
				// Call the assertion callback
				done(postitemSaveErr);
			});
	});

	it('should not be able to save Postitem instance if no name is provided', function(done) {
		// Invalidate name field
		postitem.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Postitem
				agent.post('/postitems')
					.send(postitem)
					.expect(400)
					.end(function(postitemSaveErr, postitemSaveRes) {
						// Set message assertion
						(postitemSaveRes.body.message).should.match('Please fill Postitem name');
						
						// Handle Postitem save error
						done(postitemSaveErr);
					});
			});
	});

	it('should be able to update Postitem instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Postitem
				agent.post('/postitems')
					.send(postitem)
					.expect(200)
					.end(function(postitemSaveErr, postitemSaveRes) {
						// Handle Postitem save error
						if (postitemSaveErr) done(postitemSaveErr);

						// Update Postitem name
						postitem.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Postitem
						agent.put('/postitems/' + postitemSaveRes.body._id)
							.send(postitem)
							.expect(200)
							.end(function(postitemUpdateErr, postitemUpdateRes) {
								// Handle Postitem update error
								if (postitemUpdateErr) done(postitemUpdateErr);

								// Set assertions
								(postitemUpdateRes.body._id).should.equal(postitemSaveRes.body._id);
								(postitemUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Postitems if not signed in', function(done) {
		// Create new Postitem model instance
		var postitemObj = new Postitem(postitem);

		// Save the Postitem
		postitemObj.save(function() {
			// Request Postitems
			request(app).get('/postitems')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Postitem if not signed in', function(done) {
		// Create new Postitem model instance
		var postitemObj = new Postitem(postitem);

		// Save the Postitem
		postitemObj.save(function() {
			request(app).get('/postitems/' + postitemObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', postitem.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Postitem instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Postitem
				agent.post('/postitems')
					.send(postitem)
					.expect(200)
					.end(function(postitemSaveErr, postitemSaveRes) {
						// Handle Postitem save error
						if (postitemSaveErr) done(postitemSaveErr);

						// Delete existing Postitem
						agent.delete('/postitems/' + postitemSaveRes.body._id)
							.send(postitem)
							.expect(200)
							.end(function(postitemDeleteErr, postitemDeleteRes) {
								// Handle Postitem error error
								if (postitemDeleteErr) done(postitemDeleteErr);

								// Set assertions
								(postitemDeleteRes.body._id).should.equal(postitemSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Postitem instance if not signed in', function(done) {
		// Set Postitem user 
		postitem.user = user;

		// Create new Postitem model instance
		var postitemObj = new Postitem(postitem);

		// Save the Postitem
		postitemObj.save(function() {
			// Try deleting Postitem
			request(app).delete('/postitems/' + postitemObj._id)
			.expect(401)
			.end(function(postitemDeleteErr, postitemDeleteRes) {
				// Set message assertion
				(postitemDeleteRes.body.message).should.match('User is not logged in');

				// Handle Postitem error error
				done(postitemDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Postitem.remove().exec();
		done();
	});
});