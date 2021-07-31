// Used with pyscratch.py and sbx2py.py.
// Acts as a bridge between Scratch and Python, allowing full control of Scratch from a Python program.
//
// Adjusting from the old scratchx module to scratch 3.0
//
// Copyright (C) 2017 Yoav Weiss (weiss.yoav@gmail.com)

console.log("test1");

const events = {
	EVENT_MODE : 0,
	EVENT_MOTION : 1,
	EVENT_HELD_CHANGED : 2,
	//EVENT_OPPOSITE_PRESSED : 3,
	EVENT_UPPER_PRESSED : 4,
	//EVENT_RAW : 5,
	//EVENT_KEEPALIVE : 6
}

const motions = {
	MOTION_NONE : 0,
	MOTION_SWISH_RIGHT : 1,
	MOTION_SWISH_LEFT : 2,
	MOTION_SWISH_UP : 3,
	MOTION_SWISH_DOWN : 4,
	MOTION_WRIST_RIGHT : 5,
	MOTION_WRIST_LEFT : 6
}

class Wand {

	constructor() {
		//this.vars = Object();
		this.events = { 'connected':[], 'disconnected':[], 'right':[], 'left':[], 'up':[], 'down':[], 'roll_right':[], 'roll_left':[], 'held':[], 'unheld':[], 'pressed':[] };
		this.last_state = {"effect": 0, "bri": 0, "ay": 0, "held": false, "gz": 0, "az": 0, "upper_touched": false, "opposite_touched": false, "gx": 0, "ax": 0, "y_orientation": 0, "gy": 0, "mode": -1};
		this.last_seen = -1;
		this.url = 'http://192.168.10.8:9898/';
		this.disconnected = false;
		this.loaded = false;
	}

	fetchEvents(callback) {
		var data = {};
		return fetch(this.url+'get_events', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).catch(error => {
			console.log(error);
			return {"last_seen": 9999, "events": [{"effect": 0, "motion": "none", "bri": 0, "ay": 0, "held": false, "event": events.EVENT_MODE, "gz": 0, "az": 0, "upper_touched": false, "opposite_touched": false, "gx": 0, "ax": 0, "y_orientation": 0, "gy": 0, "mode": -1}], "last_state": {"effect": 0, "bri": 0, "ay": 0, "held": false, "gz": 0, "az": 0, "upper_touched": false, "opposite_touched": false, "gx": 0, "ax": 0, "y_orientation": 0, "gy": 0, "mode": -1}, "error":error};
		}).then(res => callback(res, this));
	}

/*
	fetchEvents(callback) {
		var v = {'uuid':this.uuid, 'name':name};
		var comp = [];
		var w,k;
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

		return fetch(this.url+'fetchcmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(v)
		}).then(res => res.json()).catch(error => {
			console.log(error);
			return {"clone_id":"UNKNOWN","cmds":[{"cmd":"DISCONNECTED","clone_id":"UNKNOWN"}],"error":error};
		}).then(res => callback(res, this));
	}

	deliverEvent(event_name, event_arg, clone_id, callback) {
		var d = { 'uuid' : this.uuid, 'clone_id' : clone_id, 'event' : event_name, 'arg' : event_arg, 'vars' : JSON.stringify(this.vars[clone_id]) };

		return fetch(this.url+'event', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(d)
		}).then(res => res.json()).catch(error => {
			console.log(error);
			return {"clone_id":"DISCONNECTED","error":error};
		}).then(res => callback(res, this));
	}

	deliverVar(name, value, callback) {
		var d = { 'uuid' : this.uuid, 'name' : name, 'value' : value };

		return fetch(this.url+'newvar', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(d)
		}).then(res => res.json()).catch(error => {
			console.log(error);
			return {"clone_id":"DISCONNECTED","error":error};
		}).then(res => callback(res, this));
	}

	deliverStart(callback) {
		var d = { 'uuid' : this.uuid };

		return fetch(this.url+'start', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(d)
		}).then(res => res.json()).catch(error => {
			console.log(error);
			return {"clone_id":"DISCONNECTED","error":error};
		}).then(res => callback(res, this));
	}

*/

	// Cleanup function when the extension is unloaded
	_shutdown() {this.loaded = false;}

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	_getStatus() {
		return {status: 2, msg: 'Ready'};
	}

/*
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
				var name = clone_id.substring(0, clone_id.lastIndexOf("-"))
				this.completed[name].push(this.vars[clone_id].cmd_args.wait);
			} else if (('cmd_args' in this.vars[clone_id]) && ('cmd' in this.vars[clone_id].cmd_args) &&
					   this.vars[clone_id].cmd_args.cmd == 'DISCONNECTED') {
				this.disconnected = false;	// Time to retry
			}
			var cmdq = this.cmds[clone_id];
			if (cmdq.length == 0) {
				this.vars[clone_id].cmd_args = {};
				return true;	// Abort loop until next broadcast
			}
			this.vars[clone_id].cmd_args = cmdq.shift();
		}
		return false;
	}

	getCommands({name}) {
		//if (name in this.fetching)
			//return;
		//this.concurrency_check++;
		//console.log(this.concurrency_check);
		//this.fetching[name] = true;
		//this.fetchCommand(name, function(data, pyscratch) {
		return this.fetchCommand(name, function(data, pyscratch) {
			var c,k;
			//console.log(data);
			for (c in data.cmds) {
				var cmd_args = data.cmds[c];
				var clone_id = cmd_args.clone_id;
				if (cmd_args.cmd == 'forget') {
					// Delete stale clone vars
					//console.log("forgetting "+cmd_args.forget_clone_id);
					delete pyscratch.vars[cmd_args.forget_clone_id];
					delete pyscratch.cmds[cmd_args.forget_clone_id];
				} else if (cmd_args.cmd == 'js' && clone_id in pyscratch.vars && 'script' in cmd_args) {
					try {
						var res = eval(cmd_args.script);
						if (res)
							pyscratch.vars[clone_id]['js_result'] = res;
						else
							pyscratch.vars[clone_id]['js_result'] = '';
					} catch(err) {
						pyscratch.vars[clone_id]['js_result'] = 'error: '+err;
					}
				} else if (cmd_args.cmd == 'flush') {
					for (k in pyscratch.cmds) {
						//if (k.startsWith(name+'-')) {
							pyscratch.cmds[k] = [];
						//}
					}
				} else if (cmd_args.cmd == 'DISCONNECTED') {
					if (!pyscratch.disconnected) {
						for (k in pyscratch.cmds) {
							if (!k.startsWith('Stage-')) {
								// Non-stage objects "say" the error.
								pyscratch.cmds[k].push(cmd_args);
							} else {
								// Try to restart the session, in case the server was restarted.
								pyscratch.loaded = false;
							}
						}
						pyscratch.disconnected = true;
					}
				} else if (clone_id in pyscratch.cmds) {
					pyscratch.disconnected = false;
					pyscratch.cmds[clone_id].push(cmd_args);
				} else {
					console.log("ERROR: got command "+JSON.stringify(cmd_args)+" for unknown "+clone_id);
				}
			}
			//pyscratch.concurrency_check--;
			//delete pyscratch.fetching[data.name];
			if (pyscratch.disconnected) {
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
		var ret = this.fetchCloneID(object_name, cur_id, function(data, pyscratch) {
			pyscratch.vars[data.clone_id] = { 'clone_id' : data.clone_id };
			pyscratch.vars[data.clone_id].uuid = pyscratch.uuid;
			pyscratch.cmds[data.clone_id] = [];
			if (!(object_name in pyscratch.completed))
				pyscratch.completed[object_name] = []
			console.log('New object '+object_name+' got clone_id '+data.clone_id);
			return data.clone_id;
		});
		//console.log(ret);
		return ret;
	}

	sendEvent({event_name, event_arg, clone_id}) {
		return this.deliverEvent(event_name, event_arg, clone_id, function(data, pyscratch) {});
	}

	startEvent() {
		return this.deliverStart(function(data, pyscratch) {
			pyscratch.uuid = data.uuid;
			console.log('sent start event, UUID='+pyscratch.uuid);
			return;
		});
	}

	createVar({name, value}) {
		return this.deliverVar(name, value, function(data, pyscratch) {
			console.log('created var '+name+' = '+value);
			return;
		});
	}

	createColorVar({name, value}) {
		return this.deliverVar(name, value, function(data, pyscratch) {
			console.log('created color var '+name+' = '+value);
			return;
		});
	}

*/
	getEvents({URL}) {
		this.url = URL;
		return this.fetchEvents(function(data, wand) {
			this.last_seen = data.last_seen;
			this.last_state = data.last_state;
			while (data.events.length > 0) {
				var ev = this.events.shift();
				switch (ev.event) {
					case events.EVENT_MODE:
						if (ev.mode == 2) {
							console.log('connected');
							this.events.connected.push(ev);
						} else {
							console.log('disconnected');
							this.events.disconnected.push(ev);
						}
						break;
					case events.EVENT_MOTION:
						switch (ev.motion) {
							case motions.MOTION_SWISH_RIGHT:
								console.log('right');
								this.events.right.push(ev);
								break;
							case motions.MOTION_SWISH_LEFT:
								console.log('left');
								this.events.left.push(ev);
								break;
							case motions.MOTION_SWISH_UP:
								console.log('up');
								this.events.up.push(ev);
								break;
							case motions.MOTION_SWISH_DOWN:
								console.log('down');
								this.events.down.push(ev);
								break;
							case motions.MOTION_SWISH_WRIST_RIGHT:
								console.log('roll_right');
								this.events.roll_right.push(ev);
								break;
							case motions.MOTION_SWISH_WRIST_LEFT:
								console.log('roll_left');
								this.events.roll_left.push(ev);
								break;
						}
						break;
					case events.EVENT_HELD_CHANGED:
						if (ev.held) {
							console.log('held');
							this.events.held.push(ev);
						} else {
							console.log('unheld');
							this.events.unheld.push(ev);
						}
						break;
					case events.EVENT_UPPER_PRESSED:
						console.log('pressed');
						this.events.pressed.push(ev);
						break;
				}
			}
			return;
		});
	}

	connected() {
		return this.events.connected.shift() != 'undefined';
	}

	disconnected() {
		return this.events.disconnected.shift() != 'undefined';
	}

	right() {
		return this.events.right.shift() != 'undefined';
	}

	left() {
		return this.events.left.shift() != 'undefined';
	}

	up() {
		return this.events.up.shift() != 'undefined';
	}

	down() {
		return this.events.down.shift() != 'undefined';
	}

	roll_right() {
		return this.events.roll_right.shift() != 'undefined';
	}

	roll_left() {
		return this.events.roll_left.shift() != 'undefined';
	}

	held() {
		return this.events.held.shift() != 'undefined';
	}

	unheld() {
		return this.events.unheld.shift() != 'undefined';
	}

	pressed() {
		return this.events.pressed.shift() != 'undefined';
	}

	mode() {
		return this.last_state.mode;
	}

	effect() {
		return this.last_state.effect
	}

	bri() {
		return this.last_state.bri;
	}

	held() {
		return this.last_state.held;
	}

	upper_touched() {
		return this.last_state.upper_touched;
	}

	gx() {
		return this.last_state.gx;
	}

	gy() {
		return this.last_state.gy;
	}

	gz() {
		return this.last_state.gz;
	}

	ax() {
		return this.last_state.ax;
	}

	ay() {
		return this.last_state.ay;
	}

	az() {
		return this.last_state.az;
	}

	isUp() {
		return this.last_state.y_orientation > 0;
	}

	isDown() {
		return this.last_state.y_orientation < 0;
	}

	isLevel() {
		return this.last_state.y_orientation == 0;
	}

	isHeld() {
		return this.last_state.held;
	}

	isConnected() {
		return this.last_state.mode == 2;
	}

	isUpperTouched() {
		return this.last_state.upper_touched;
	}

	setEffect({EFFECT}) {
		// XXX
	}

	setBrightness({BRI}) {
		// XXX
	}

	setLeds({LED,COLOR}) {
		// XXX
	}

	sendLeds({URL}) {
		// XXX
	}

	toggleLight({URL}) {
		return fetch(URL, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(res => res.json()).catch(error => {
			console.log(error);
		}).then(() => {
			console.log("success");
        });
	}

	fanOn({URL}) {
		return fetch(URL, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(res => res.json()).catch(error => {
			console.log(error);
		}).then(() => {
			console.log("success");
        });
	}

	fanOff({URL}) {
		return fetch(URL, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(res => res.json()).catch(error => {
			console.log(error);
		}).then(() => {
			console.log("success");
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
			id: 'wand',
			name: 'Wand',

			blocks: [
				{
					opcode: 'getEvents',

					blockType: Scratch.BlockType.COMMAND,

					text: 'get events from the wand at [URL]',
					arguments: {
						URL: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: 'http://192.168.10.8:9898/'
						}
					}
				},
				{
					opcode: 'connected',

					blockType: Scratch.BlockType.HAT,

					text: 'wand connected',
					arguments: {}
				},
				{
					opcode: 'disconnected',

					blockType: Scratch.BlockType.HAT,

					text: 'wand disconnected',
					arguments: {}
				},
				{
					opcode: 'right',

					blockType: Scratch.BlockType.HAT,

					text: 'wand swished right',
					arguments: {}
				},
				{
					opcode: 'left',

					blockType: Scratch.BlockType.HAT,

					text: 'wand swished left',
					arguments: {}
				},
				{
					opcode: 'up',

					blockType: Scratch.BlockType.HAT,

					text: 'wand swished up',
					arguments: {}
				},
				{
					opcode: 'down',

					blockType: Scratch.BlockType.HAT,

					text: 'wand swished down',
					arguments: {}
				},
				{
					opcode: 'roll_right',

					blockType: Scratch.BlockType.HAT,

					text: 'wand rolled right',
					arguments: {}
				},
				{
					opcode: 'roll_left',

					blockType: Scratch.BlockType.HAT,

					text: 'wand rolled left',
					arguments: {}
				},
				{
					opcode: 'held',

					blockType: Scratch.BlockType.HAT,

					text: 'wand picked up',
					arguments: {}
				},
				{
					opcode: 'unheld',

					blockType: Scratch.BlockType.HAT,

					text: 'wand put down',
					arguments: {}
				},
				{
					opcode: 'pressed',

					blockType: Scratch.BlockType.HAT,

					text: 'wand upper touch pressed',
					arguments: {}
				},
				{
					opcode: 'mode',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get wand mode',
					arguments: {
					}
				},
				{
					opcode: 'effect',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get wand effect',
					arguments: {
					}
				},
				{
					opcode: 'bri',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get wand brightness',
					arguments: {
					}
				},
				{
					opcode: 'ax',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get accelerometer x',
					arguments: {
					}
				},
				{
					opcode: 'ay',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get accelerometer y',
					arguments: {
					}
				},
				{
					opcode: 'az',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get accelerometer z',
					arguments: {
					}
				},
				{
					opcode: 'gx',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get gyro x',
					arguments: {
					}
				},
				{
					opcode: 'gy',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get gyro y',
					arguments: {
					}
				},
				{
					opcode: 'gz',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get gyro z',
					arguments: {
					}
				},
				{
					opcode: 'mode',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get wand mode',
					arguments: {
					}
				},
				{
					opcode: 'mode',

					blockType: Scratch.BlockType.REPORTER,

					text: 'get wand mode',
					arguments: {
					}
				},
				{
					opcode: 'isHeld',

					blockType: Scratch.BlockType.BOOLEAN,

					text: 'is the wand held?',
					arguments: {
					}
				},
				{
					opcode: 'isConnected',

					blockType: Scratch.BlockType.BOOLEAN,

					text: 'is the wand connected?',
					arguments: {
					}
				},
				{
					opcode: 'isUpperTouched',

					blockType: Scratch.BlockType.BOOLEAN,

					text: 'is the upper touchpad touched?',
					arguments: {
					}
				},
				{
					opcode: 'isUp',

					blockType: Scratch.BlockType.BOOLEAN,

					text: 'is the wand pointed up?',
					arguments: {
					}
				},
				{
					opcode: 'isDown',

					blockType: Scratch.BlockType.BOOLEAN,

					text: 'is the wand pointed down?',
					arguments: {
					}
				},
				{
					opcode: 'isLevel',

					blockType: Scratch.BlockType.BOOLEAN,

					text: 'is the wand level?',
					arguments: {
					}
				},
				{
					opcode: 'setEffect',

					blockType: Scratch.BlockType.COMMAND,

					text: 'set wand effect to [EFFECT]',
					arguments: {
						EFFECT: {
								type: Scratch.ArgumentType.NUMBER,
								defaultValue: 1
						}
					}
				},
				{
					opcode: 'setBrightness',

					blockType: Scratch.BlockType.COMMAND,

					text: 'set wand brightness to [BRI]',
					arguments: {
						EFFECT: {
								type: Scratch.ArgumentType.NUMBER,
								defaultValue: 100
						}
					}
				},
				{
					opcode: 'setLeds',

					blockType: Scratch.BlockType.COMMAND,

					text: 'set the color of [LED] to [COLOR]',
					arguments: {
						LED: {
								type: Scratch.ArgumentType.NUMBER,
								defaultValue: 0
						},
						COLOR: {
								type: Scratch.ArgumentType.COLOR,
								defaultValue: 0
						}
					}
				},
				{
					opcode: 'sendLeds',

					blockType: Scratch.BlockType.COMMAND,

					text: 'send the led colors to [URL]',
					arguments: {
						URL: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: 'http://192.168.10.8:9898/'
						}
					}
				},
				{
					opcode: 'toggleLight',

					blockType: Scratch.BlockType.COMMAND,

					text: 'toggle the light using [URL]',
					arguments: {
						URL: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: 'http://192.168.10.236/cm?cmnd=RfRaw%20AA%20B0%2015%2003%2004%20014A%20028A%2027A6%2009281809090909091818181818%2055'
						}
					}
				},
				{
					opcode: 'fanOn',

					blockType: Scratch.BlockType.COMMAND,

					text: 'turn on the fan using [URL]',
					arguments: {
						URL: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: 'http://192.168.10.236/cm?cmnd=RfRaw%20AA%20B0%2015%2003%2004%200154%20028A%2027EC%2018281809090909090918181809%2055'
						}
					}
				},
				{
					opcode: 'fanOff',

					blockType: Scratch.BlockType.COMMAND,

					text: 'turn off the fan using [URL]',
					arguments: {
						URL: {
								type: Scratch.ArgumentType.STRING,
								defaultValue: 'http://192.168.10.236/cm?cmnd=RfRaw%20AA%20B0%2017%2004%2004%200186%20010E%2002C6%2027D8%2038081A1A1A1A0A080808080A28%2055'
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

