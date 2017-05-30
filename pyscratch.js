// Used with pyscratch.py and sbx2py.py.
// Acts as a bridge between Scratch and Python, allowing full control of Scratch from a Python program.
//
// Copyright (C) 2017 Yoav Weiss (weiss.yoav@gmail.com)

(function(ext) {

	vars = Object();
	cmds = Object();
	url = 'http://localhost:9000/';
	uuid = '';
	completed = {};
	disconnected = false;
	loaded = false;

	window.JSshowWarning = function(){console.log('ext loaded');return true;};

	function fetchCloneID(obj_name, cur_id, callback) {

		$.ajax({
			url: url+'new',
			data: { 'uuid' : uuid, 'name' : obj_name, 'cur_clone_id' : cur_id },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				callback(data);
			},
			error: function (textStatus, errorThrown) {
				callback({"clone_id":"DISCONNECTED","error":textStatus});
			}
		});
	}

	function fetchCommand(name, callback) {

		v = {'uuid':uuid, 'name':name};

		comp = [];
		if (!(name in completed))
			completed[name] = []
		while ((w = completed[name].shift()))
			comp.push(w);
		v['completed'] = JSON.stringify(comp);

		// Get vars for all clones of this object
		for (k in vars) {
			if (k.startsWith(name+'-')) {
				v[k] = JSON.stringify(vars[k]);
			}
		}

		$.ajax({
			url: url+'fetchcmd',
			data: v,
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				callback(data);
			},
			error: function (textStatus, errorThrown) {
				console.log('Failed fetch for '+name);
				callback({"clone_id":"UNKNOWN","cmds":[{"cmd":"DISCONNECTED","clone_id":"UNKNOWN"}],"error":textStatus});
			}
		});
	}

	function deliverEvent(event_name, event_arg, clone_id, callback) {

		$.ajax({
			url: url+'event',
			data: { 'uuid' : uuid, 'clone_id' : clone_id, 'event' : event_name, 'arg' : event_arg, 'vars' : JSON.stringify(vars[clone_id]) },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				callback(data);
			},
			error: function (textStatus, errorThrown) {
				callback({"clone_id":"DISCONNECTED","error":textStatus});
			}
		});
	}

	function deliverVar(name, value, callback) {

		$.ajax({
			url: url+'newvar',
			data: { 'uuid' : uuid, 'name' : name, 'value' : value },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				callback(data);
			},
			error: function (textStatus, errorThrown) {
				callback({"clone_id":"DISCONNECTED","error":textStatus});
			}
		});
	}

	function deliverStart(callback) {

		$.ajax({
			url: url+'start',
			data: { 'uuid' : uuid },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				callback(data);
			},
			error: function (textStatus, errorThrown) {
				callback({"clone_id":"DISCONNECTED","error":textStatus});
			}
		});
	}

	// Cleanup function when the extension is unloaded
	ext._shutdown = function() {loaded = false;};

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	ext._getStatus = function() {
		return {status: 2, msg: 'Ready'};
	};

	ext.setVar = function(name,value,clone_id) {
		vars[clone_id][name] = value;
		//console.log('Set '+name+' = '+value+' for '+clone_id);
		return;
	};

	ext.removeVar = function(name,clone_id) {
		delete vars[clone_id][name];
		//console.log('Removed var '+name+' for '+clone_id);
		return;
	};

	ext.setUrl = function(u) {
		url = u;
		//console.log('Set url to '+url);
		return;
	};

	ext.getCommandArg = function(arg_name, clone_id) {
		if (!clone_id.includes('-')) {
			// First object (non-clone) on first run
			return 'get_clone_id';
		} else if (!(clone_id in cmds)) {
			// Unknown object (python restarted, scratch hasn't)
			return 'get_clone_id';
		}
		return vars[clone_id].cmd_args[arg_name];
	};

	ext.getNextCommand = function(clone_id) {
		if (clone_id in cmds) {
			if (('cmd_args' in vars[clone_id]) && ('wait' in vars[clone_id].cmd_args)) {
				name = clone_id.substring(0, clone_id.lastIndexOf("-"))
				completed[name].push(vars[clone_id].cmd_args.wait);
			} else if (('cmd_args' in vars[clone_id]) && ('cmd' in vars[clone_id].cmd_args) &&
			           vars[clone_id].cmd_args.cmd == 'DISCONNECTED') {
				disconnected = false;	// Time to retry
			}
			cmdq = cmds[clone_id];
			if (cmdq.length == 0) {
				vars[clone_id].cmd_args = {};
				return true;	// Abort loop until next broadcast
			}
			vars[clone_id].cmd_args = cmdq.shift();
		}
		return false;
	};

	ext.getCommands = function(name, callback) {
		fetchCommand(name, function(data) {
			for (c in data.cmds) {
				cmd_args = data.cmds[c];
				clone_id = cmd_args.clone_id;
				if (cmd_args.cmd == 'forget') {
					// Delete stale clone vars
					//console.log("forgetting "+cmd_args.forget_clone_id);
					delete vars[cmd_args.forget_clone_id];
					delete cmds[cmd_args.forget_clone_id];
				} else if (cmd_args.cmd == 'flush') {
					for (k in cmds) {
						//if (k.startsWith(name+'-')) {
							cmds[k] = [];
						//}
					}
				} else if (cmd_args.cmd == 'DISCONNECTED') {
					if (!disconnected) {
						for (k in cmds) {
							if (!k.startsWith('Stage-')) {
								// Non-stage objects "say" the error.
								cmds[k].push(cmd_args);
							} else {
								// Try to restart the session, in case the server was restarted.
								loaded = false;
							}
						}
						disconnected = true;
					}
				} else if (clone_id in cmds) {
					disconnected = false;
					cmds[clone_id].push(cmd_args);
				} else {
					console.log("ERROR: got command "+JSON.stringify(cmd_args)+" for unknown "+clone_id);
				}
			}
			if (disconnected) {
                new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
					console.log("Retrying server");
					callback();
                });

			} else {
				callback();
			}
		});
	};

	ext.getCloneID = function(object_name, cur_id, callback) {
		fetchCloneID(object_name, cur_id, function(data) {
			vars[data.clone_id] = { 'clone_id' : data.clone_id };
			vars[data.clone_id].uuid = uuid;
			cmds[data.clone_id] = [];
			if (!(object_name in completed))
				completed[object_name] = []
			//console.log('New object '+object_name+' got clone_id '+data.clone_id);
			callback(data.clone_id);
		});
	};

	ext.sendEvent = function(event_name, event_arg, clone_id, callback) {
		deliverEvent(event_name, event_arg, clone_id, function(data) {
			//console.log('sent event '+event_name+'('+event_arg+') for '+clone_id);
			callback();
		});
	};

	ext.startEvent = function(callback) {
		deliverStart(function(data) {
			uuid = data.uuid;
			//console.log('sent start event, UUID='+uuid);
			callback();
		});
	};

	ext.createVar = function(name, value, callback) {
		deliverVar(name, value, function(data) {
			//console.log('created var '+name+' = '+value);
			callback();
		});
	};

	ext.scratchLog = function(l1, l2, l3) {
		console.log(l1,l2,l3);
		return;
	};

	ext.when_loaded = function() {
		if (loaded)
			return false;
		console.log('extension starting');
		loaded = true;
		return true;
	};


	// Block and block menu descriptions
	var descriptor = {
		blocks: [
			['R', 'get new clone_id for object %s current is %s', 'getCloneID', '', ''],
			['w', 'fetch commands for object %s', 'getCommands', ''],
			['r', 'get command arg %s for clone_id %s', 'getCommandArg', '', ''],
			['r', 'get next command for clone_id %s', 'getNextCommand', ''],
			[' ', 'set var %s to %s for clone_id %s', 'setVar', '', '', ''],
			[' ', 'remove var %s for clone_id %s', 'removeVar', '', ''],
			[' ', 'set url to %s', 'setUrl', 'http://localhost:9000/'],
			['w', 'send event %s with arg %s for clone_id %s', 'sendEvent', '', '', ''],
			['w', 'send start event', 'startEvent'],
			['w', 'create python constant %s for color %c', 'createVar', '', ''],
			['w', 'create python constant %s with value %s', 'createVar', '', ''],
			['h', 'Extension loaded', 'when_loaded'],
			[' ', 'log %s %s %s', 'scratchLog', '', '', ''],
		],
		menus: {
		}
	};

	// Register the extension
	ScratchExtensions.register('pyscratch extension', descriptor, ext);

})({});
