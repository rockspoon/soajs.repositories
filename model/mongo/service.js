/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "services";
const core = require("soajs");
const Mongo = core.mongo;

let indexing = {};

function Service(service, options, mongoCore) {
	let __self = this;
	
	if (mongoCore) {
		__self.mongoCore = mongoCore;
	}
	if (!__self.mongoCore) {
		if (options && options.dbConfig) {
			__self.mongoCore = new Mongo(options.dbConfig);
		} else {
			let registry = service.registry.get();
			__self.mongoCore = new Mongo(registry.coreDB.provision);
		}
	}
	let index = "default";
	if (options && options.index) {
		index = options.index;
	}
	if (indexing && !indexing[index]) {
		indexing[index] = true;
		//todo add indexes
		service.log.debug("Service: Indexes for " + index + " Updated!");
	}
}

Service.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

Service.prototype.validateId = function (id, cb) {
	let __self = this;
	
	if (!id) {
		let error = new Error("id is required.");
		return cb(error, null);
	}
	
	try {
		id = __self.mongoCore.ObjectId(id);
		return cb(null, id);
	} catch (e) {
		return cb(e, null);
	}
};

Service.prototype.update = function (data, cb) {
	let __self = this;
	if (!data ) {
		let error = new Error("Git: must provide data");
		return cb(error, error);
	}
	let condition = {
		name: data.name,
		port: data.port,
		type: "service"
	};
	let options = {'upsert': true, 'safe': true};
	let fields = {
		'$set': data
	};
	__self.mongoCore.updateOne(colName, condition, fields, options, cb);
};

Service.prototype.removeService = function (data, cb) {
	let __self = this;
	if (!data || !data.id) {
		let error = new Error("No data provided.");
		return cb(error, error);
	}
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		let condition = {
			_id: data.id
		};
		__self.mongoCore.deleteOne(colName, condition, (err, response) => {
			return cb(err, response);
		});
	});
};

Service.prototype.removeRepository = function (data, cb) {
	let __self = this;
	if (!data || !(data.source || data.owner || data.repo)) {
		let error = new Error("No data provided.");
		return cb(error, error);
	}
	
	let condition = {
		"src.source": data.source,
		"src.owner": data.owner,
		"src.repo": data.repo
	};
	let options = {'upsert': false, 'safe': true};
	let fields = {
		'$set': {
			src : {}
		}
	};
	__self.mongoCore.updateOne(colName, condition, fields, options, cb);
};

module.exports = Service;