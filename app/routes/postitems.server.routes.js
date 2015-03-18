'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var postitems = require('../../app/controllers/postitems.server.controller');

	// Postitems Routes
	app.route('/postitems')
		.get(postitems.list)
		.post(users.requiresLogin, postitems.create);

	app.route('/postitems/:postitemId')
		.get(postitems.read)
		.put(users.requiresLogin, postitems.hasAuthorization, postitems.update)
		.delete(users.requiresLogin, postitems.hasAuthorization, postitems.delete);

	// Finish by binding the Postitem middleware
	app.param('postitemId', postitems.postitemByID);
};
