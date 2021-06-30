// Used with pyscratch.py and sbx2py.py.
// Acts as a bridge between Scratch and Python, allowing full control of Scratch from a Python program.
//
// Adjusting from the old scratchx module to scratch 3.0
//
// Copyright (C) 2017 Yoav Weiss (weiss.yoav@gmail.com)

console.log("test26");

class Pyscratch {

	constructor() {
		this.vars = Object();
		this.cmds = Object();
		this.url = 'http://localhost:9000/';
		this.uuid = '';
		this.completed = {};
		this.disconnected = false;
		this.loaded = false;

		//window.JSshowWarning = function(){console.log('ext loaded');return true;};
	}

	fetchCloneID(obj_name, cur_id) {

		var data = { 'uuid' : this.uuid, 'name' : obj_name, 'cur_clone_id' : cur_id };
		const response = fetch(this.url+'new', {
			method: 'POST',
			mode: 'no-cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).catch(err => 'ERROR');
		console.log('returning ',response);
		return response;
	}

	fetchCommand(name) {

		var v = {'uuid':this.uuid, 'name':name};

		var comp = [];
		if (!(name in this.completed))
			this.completed[name] = []
		while ((w = this.completed[name].shift()))
			comp.push(w);
		v['completed'] = JSON.stringify(comp);

		// Get vars for all clones of this object
		for (k in this.vars) {
			if (k.startsWith(name+'-')) {
				v[k] = JSON.stringify(this.vars[k]);
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
			data: { 'uuid' : this.uuid, 'clone_id' : clone_id, 'event' : event_name, 'arg' : event_arg, 'vars' : JSON.stringify(this.vars[clone_id]) },
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
			data: { 'uuid' : this.uuid, 'name' : name, 'value' : value },
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
			data: { 'uuid' : this.uuid },
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
	_shutdown() {this.loaded = false;}

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	_getStatus() {
		return {status: 2, msg: 'Ready'};
	}

	setVar({name,value,clone_id}) {
		this.vars[clone_id][name] = value;
		//console.log('Set '+name+' = '+value+' for '+clone_id);
		return;
	}

	removeVar({name,clone_id}) {
		delete this.vars[clone_id][name];
		//console.log('Removed var '+name+' for '+clone_id);
		return;
	}

	setUrl({u}) {
		this.url = u;
		console.log('Set url to '+this.url);
		return;
	}

	getCommandArg({arg_name, clone_id}) {
		if (!clone_id.includes('-')) {
			// First object (non-clone) on first run
			return 'get_clone_id';
		} else if (!(clone_id in this.cmds)) {
			// Unknown object (python restarted, scratch hasn't)
			return 'get_clone_id';
		}
		return this.vars[clone_id].cmd_args[arg_name];
	}

	getNextCommand({clone_id}) {
		if (clone_id in this.cmds) {
			if (('cmd_args' in this.vars[clone_id]) && ('wait' in this.vars[clone_id].cmd_args)) {
				name = clone_id.substring(0, clone_id.lastIndexOf("-"))
				this.completed[name].push(this.vars[clone_id].cmd_args.wait);
			} else if (('cmd_args' in this.vars[clone_id]) && ('cmd' in this.vars[clone_id].cmd_args) &&
					   this.vars[clone_id].cmd_args.cmd == 'DISCONNECTED') {
				this.disconnected = false;	// Time to retry
			}
			cmdq = this.cmds[clone_id];
			if (cmdq.length == 0) {
				this.vars[clone_id].cmd_args = {};
				return true;	// Abort loop until next broadcast
			}
			this.vars[clone_id].cmd_args = cmdq.shift();
		}
		return false;
	}

	getCommands({name}) {
		this.fetchCommand(name, function(data) {
			for (c in data.cmds) {
				cmd_args = data.cmds[c];
				clone_id = cmd_args.clone_id;
				if (cmd_args.cmd == 'forget') {
					// Delete stale clone vars
					//console.log("forgetting "+cmd_args.forget_clone_id);
					delete this.vars[cmd_args.forget_clone_id];
					delete this.cmds[cmd_args.forget_clone_id];
				} else if (cmd_args.cmd == 'js' && clone_id in this.vars && 'script' in cmd_args) {
					try {
						res = eval(cmd_args.script);
						if (res)
							this.vars[clone_id]['js_result'] = res;
						else
							this.vars[clone_id]['js_result'] = '';
					} catch(err) {
						this.vars[clone_id]['js_result'] = 'error: '+err;
					}
				} else if (cmd_args.cmd == 'flush') {
					for (k in this.cmds) {
						//if (k.startsWith(name+'-')) {
							this.cmds[k] = [];
						//}
					}
				} else if (cmd_args.cmd == 'DISCONNECTED') {
					if (!this.disconnected) {
						for (k in this.cmds) {
							if (!k.startsWith('Stage-')) {
								// Non-stage objects "say" the error.
								this.cmds[k].push(cmd_args);
							} else {
								// Try to restart the session, in case the server was restarted.
								this.loaded = false;
							}
						}
						this.disconnected = true;
					}
				} else if (clone_id in this.cmds) {
					this.disconnected = false;
					this.cmds[clone_id].push(cmd_args);
				} else {
					console.log("ERROR: got command "+JSON.stringify(cmd_args)+" for unknown "+clone_id);
				}
			}
			if (this.disconnected) {
				new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
					console.log("Retrying server");
					return;
				});

			} else {
				return;
			}
		});
	}

	getCloneID({object_name, cur_id}) {
		var data = this.fetchCloneID(object_name, cur_id);
		console.log(data);
		this.vars[data.clone_id] = { 'clone_id' : data.clone_id };
		this.vars[data.clone_id].uuid = this.uuid;
		this.cmds[data.clone_id] = [];
		if (!(object_name in this.completed))
			this.completed[object_name] = []
		//console.log('New object '+object_name+' got clone_id '+data.clone_id);
		return data.clone_id;
	}

	sendEvent({event_name, event_arg, clone_id}) {
		this.deliverEvent(event_name, event_arg, clone_id);
	}

	startEvent() {
		this.deliverStart(function(data) {
			this.uuid = data.uuid;
			//console.log('sent start event, UUID='+uuid);
			return;
		});
	}

	createVar({name, value}) {
		this.deliverVar(name, value, function(data) {
			//console.log('created var '+name+' = '+value);
			return;
		});
	}

	createColorVar({name, value}) {
		this.deliverVar(name, value, function(data) {
			//console.log('created var '+name+' = '+value);
			return;
		});
	}

	scratchLog({l1, l2, l3}) {
		console.log(l1,l2,l3);
		return;
	}

	when_loaded() {
		if (this.loaded)
			return false;
		console.log('extension starting');
		this.loaded = true;
		return true;
	}

	getInfo() {
		return {
			id: 'pyscratch',
			name: 'Pyscratch',

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

Scratch.extensions.register(new Pyscratch());

