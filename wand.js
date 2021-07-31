// Magic wand support for scratch
//
// Copyright (C) 2021 Yoav Weiss (weiss.yoav@gmail.com)

console.log("test5");

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

	// Cleanup function when the extension is unloaded
	_shutdown() {this.loaded = false;}

	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	_getStatus() {
		return {status: 2, msg: 'Ready'};
	}

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
								defaultValue: ''
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
								//defaultValue: 'http://192.168.10.236/cm?cmnd=RfRaw%20AA%20B0%2015%2003%2004%20014A%20028A%2027A6%2009281809090909091818181818%2055'
								defaultValue: 'http://192.168.10.216/cm?cmnd=RfRaw%20AA%20B0%2017%2004%2004%200172%200258%200104%2027BA%2009381818182909091818181818%2055'
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
								//defaultValue: 'http://192.168.10.236/cm?cmnd=RfRaw%20AA%20B0%2015%2003%2004%200154%20028A%2027EC%2018281809090909090918181809%2055'
								defaultValue: 'http://192.168.10.216/cm?cmnd=RfRaw%20AA%20B0%2017%2004%2004%200172%200258%20010E%2027A6%2018381818180929090918181809%2055'
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
								//defaultValue: 'http://192.168.10.236/cm?cmnd=RfRaw%20AA%20B0%2017%2004%2004%200186%20010E%2002C6%2027D8%2038081A1A1A1A0A080808080A28%2055'
								defaultValue: 'http://192.168.10.216/cm?cmnd=RfRaw%20AA%20B0%2017%2004%2004%200172%200258%20010E%2027BA%2018381818182909091818181809%2055'
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

Scratch.extensions.register(new Wand());

