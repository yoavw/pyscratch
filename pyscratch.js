// Used with pyscratch.py and sbx2py.py.
// Acts as a bridge between Scratch and Python, allowing full control of Scratch from a Python program.
//
// Adjusting from the old scratchx module to scratch 3.0
//
// Copyright (C) 2017 Yoav Weiss (weiss.yoav@gmail.com)

console.log("test1");

class Pyscratch {

	constructor() {
		this.vars = Object();
		this.cmds = Object();
		this.url = 'http://localhost:9000/';
		this.uuid = '';
		this.completed = {};
		this.disconnected = false;
		this.loaded = false;

		window.JSshowWarning = function(){console.log('ext loaded');return true;};
	}

	fetchCloneID(obj_name, cur_id) {

		$.ajax({
			url: url+'new',
			data: { 'uuid' : uuid, 'name' : obj_name, 'cur_clone_id' : cur_id },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				return data;
			},
			error: function (textStatus, errorThrown) {
				return {"clone_id":"DISCONNECTED","error":textStatus};
			}
		});
	}

	fetchCommand(name) {

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
				return data;
			},
			error: function (textStatus, errorThrown) {
				console.log('Failed fetch for '+name);
				 return {"clone_id":"UNKNOWN","cmds":[{"cmd":"DISCONNECTED","clone_id":"UNKNOWN"}],"error":textStatus};
			}
		});
	}

	deliverEvent(event_name, event_arg, clone_id) {

		$.ajax({
			url: url+'event',
			data: { 'uuid' : uuid, 'clone_id' : clone_id, 'event' : event_name, 'arg' : event_arg, 'vars' : JSON.stringify(vars[clone_id]) },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				return data;
			},
			error: function (textStatus, errorThrown) {
				return {"clone_id":"DISCONNECTED","error":textStatus};
			}
		});
	}

	deliverVar(name, value) {

		$.ajax({
			url: url+'newvar',
			data: { 'uuid' : uuid, 'name' : name, 'value' : value },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				return data;
			},
			error: function (textStatus, errorThrown) {
				return {"clone_id":"DISCONNECTED","error":textStatus};
			}
		});
	}

	deliverStart() {

		$.ajax({
			url: url+'start',
			data: { 'uuid' : uuid },
			dataType: 'json',
			method: 'POST',
			cache: false,
			success: function(data) {
				return data;
			},
			error: function (textStatus, errorThrown) {
				return {"clone_id":"DISCONNECTED","error":textStatus};
			}
		});
	}

	// Cleanup function when the extension is unloaded
	_shutdown() {loaded = false;};

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	_getStatus() {
		return {status: 2, msg: 'Ready'};
	};

	setVar({name,value,clone_id}) {
		vars[clone_id][name] = value;
		//console.log('Set '+name+' = '+value+' for '+clone_id);
		return;
	};

	removeVar({name,clone_id}) {
		delete vars[clone_id][name];
		//console.log('Removed var '+name+' for '+clone_id);
		return;
	};

	setUrl({u}) {
		url = u;
		//console.log('Set url to '+url);
		return;
	};

	getCommandArg({arg_name, clone_id}) {
		if (!clone_id.includes('-')) {
			// First object (non-clone) on first run
			return 'get_clone_id';
		} else if (!(clone_id in cmds)) {
			// Unknown object (python restarted, scratch hasn't)
			return 'get_clone_id';
		}
		return vars[clone_id].cmd_args[arg_name];
	};

	getNextCommand({clone_id}) {
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

	getCommands({name}) {
		fetchCommand(name, function(data) {
			for (c in data.cmds) {
				cmd_args = data.cmds[c];
				clone_id = cmd_args.clone_id;
				if (cmd_args.cmd == 'forget') {
					// Delete stale clone vars
					//console.log("forgetting "+cmd_args.forget_clone_id);
					delete vars[cmd_args.forget_clone_id];
					delete cmds[cmd_args.forget_clone_id];
				} else if (cmd_args.cmd == 'js' && clone_id in vars && 'script' in cmd_args) {
					try {
						res = eval(cmd_args.script);
						if (res)
							vars[clone_id]['js_result'] = res;
						else
							vars[clone_id]['js_result'] = '';
					} catch(err) {
						vars[clone_id]['js_result'] = 'error: '+err;
					}
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
					return;
				});

			} else {
				return;
			}
		});
	};

	getCloneID({object_name, cur_id}) {
		return fetchCloneID(object_name, cur_id, function(data) {
			vars[data.clone_id] = { 'clone_id' : data.clone_id };
			vars[data.clone_id].uuid = uuid;
			cmds[data.clone_id] = [];
			if (!(object_name in completed))
				completed[object_name] = []
			//console.log('New object '+object_name+' got clone_id '+data.clone_id);
			 return data.clone_id;
		});
	};

	sendEvent({event_name, event_arg, clone_id}) {
		deliverEvent(event_name, event_arg, clone_id);
	};

	startEvent() {
		deliverStart(function(data) {
			uuid = data.uuid;
			//console.log('sent start event, UUID='+uuid);
			return;
		});
	};

	createVar({name, value}) {
		deliverVar(name, value, function(data) {
			//console.log('created var '+name+' = '+value);
			return;
		});
	};

	createColorVar({name, value}) {
		deliverVar(name, value, function(data) {
			//console.log('created var '+name+' = '+value);
			return;
		});
	};

	scratchLog({l1, l2, l3}) {
		console.log(l1,l2,l3);
		return;
	};

	when_loaded() {
		if (loaded)
			return false;
		console.log('extension starting');
		loaded = true;
		return true;
	};

	getInfo() {
		return {
			id: 'utilities',
			name: 'Utlities',

			color1: '#8BC34A',
			color2: '#7CB342',
			color3: '#689F38',

			menuIconURI: icon,

			blocks: [
				{
					opcode: 'getCloneID',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get new clone_id for object [object_name] current is [cur_id]',
					arguments: {
						object_name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						cur_id: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'getCommands',

					blockType: Scratch.BlockType.COMMAND,

					text: 'fetch commands for object [name]',
					arguments: {
						name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'getCommandArg',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get command arg [arg_name] for clone_id [clone_id]',
					arguments: {
						arg_name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						clone_id: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'getNextCommand',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get next command for clone_id [clone_id]',
					arguments: {
						clone_id: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'setVar',

					blockType: Scratch.BlockType.COMMAND,

					text: 'set var [name] to [value] for clone_id [clone_id]',
					arguments: {
						name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						value: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						clone_id: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'removeVar',

					blockType: Scratch.BlockType.COMMAND,

					text: 'remove var [name] for clone_id [clone_id]',
					arguments: {
						name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						clone_id: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'setUrl',

					blockType: Scratch.BlockType.COMMAND,

					text: 'set url to [u]',
					arguments: {
						u: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'sendEvent',

					blockType: Scratch.BlockType.COMMAND,

					text: 'send event [event_name] with arg [event_arg] for clone_id [clone_id]',
					arguments: {
						event_name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						event_arg: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						clone_id: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'startEvent',

					blockType: Scratch.BlockType.COMMAND,

					text: 'send start event',
					arguments: {}
				},
				{
					opcode: 'createColorVar',

					blockType: Scratch.BlockType.COMMAND,

					text: 'create python constant [name] for color [value]',
					arguments: {
						name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						value: {
								type: Scratch.ArgumentType.COLOR,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'createVar',

					blockType: Scratch.BlockType.COMMAND,

					text: 'create python constant [name] with value [value]',
					arguments: {
						name: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						value: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'when_loaded',

					blockType: Scratch.BlockType.HAT,

					text: 'Extension loaded',
					arguments: {}
				},
				{
					opcode: 'scratchLog',

					blockType: Scratch.BlockType.COMMAND,

					text: 'log [l1] [l2] [l3]',
					arguments: {
						l1: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						l2: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						},
						l3: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: ''
						}
					}
				}
			]
		}
	}
}

//Scratch.extensions.register(new Pyscratch());

