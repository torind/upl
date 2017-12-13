/**
 * Wrapper for keg related functions. Basically just maintains a text file 
 * with the list of people down for a keg.
 *
 */

var fs = require('fs');
var sns_handler = require('../SNS/sns-handler.js');
var config = require(__dirname + "/../config.js");

var filename = __dirname + "/Artifacts/keg_ps.json"

var keg_template = function() {
	return {
		timestamp: new Date(),
		critical_number : config.keg_critical_number,
		count : 0,
		ids: [],
		names: []
	}
}

var keg = {}


var write_keg_to_file = function(keg, callback) {
	var obj_str = JSON.stringify(keg);
	fs.writeFile(filename, obj_str, function(err, data) {
		if (err) { callback(err, null); }
		else {
			callback(err, "Count:" + keg.count);
		}
	});
}

var keg_file_check = function(callback) {
	fs.readFile(filename, function(err, data) {
		if (err) {
			if (err.code == 'ENOENT') {
				write_keg_to_file(keg_template(), function(err, data) {
					if(err) {
						callback("Error making new keg file", null);
					} else {
						callback(null, "Success");
					}
				})
			}
		}
		else {
			var k = JSON.parse(data);
			var k_date = new Date(k.timestamp);
			var today = new Date();
			if (k_date.toDateString() != today.toDateString()) {
				write_keg_to_file(keg_template(), function(err, data) {
					if(err) {
						callback("Error updating keg file", null);
					} else {
						callback(null, "Success");
					}
				})
			}
			else {
				callback(null, "Success!")
			}
		}
	})
}

var read_keg_from_file = function(callback) {
	keg_file_check(function(err, data) {
		if (err) {
			callback(err, null);
		}
		else {
			fs.readFile(filename, function(err, data) {
				if (err) {
					callback(err, null);
				}
				else {
					var k = JSON.parse(data);
					callback(null, k);
				}
			})
		}
	})
}

keg.get_status = function(uid, callback) {
	read_keg_from_file(function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			var status = false;
			for (var i = 0; i < data.ids.length; i++) {
				if (data.ids[i] == uid) {
					status = true;
				}
			}
			var ret_data = {
				keg: data,
				status: status
			}
			callback(null, ret_data);
		}
	})
}

keg.modify_status = function(id, name, status, callback) {
	read_keg_from_file(function(err, data) {
		if (err) {
			callback(err, null);
		}
		else {
			var k = data;

			if (status == "in") {
				if (k.ids.indexOf(id) == -1) {
					k.count += 1;
					k.ids.push(id);
					k.names.push(name);

					if (k.count == k.critical_number) {
						sns_handler.notify_keg_hit(k.names);
					}
					write_keg_to_file(k, function(err, data) {
						if (err) {
							callback(err, null);
						}
						else {
							var ret_data = {
								keg: k,
								status: status
							}
							callback(err, ret_data);
						}
					});
				}
				else {
					callback("ID has already been added to the keg", null);
				}
			}
			else if (status == "out") {
				var index = k.ids.indexOf(id);
				if (index !== -1) {
					k.count -= 1;
					k.ids.splice(index, 1);
					k.names.splice(index, 1);
					write_keg_to_file(k, callback);
				}
				else {
					callback("ID is not on the keg", null);
				}
			}
			else {
				callback("Invalid status provided", null);
				return;
			}
		}
	});
}

module.exports = keg;