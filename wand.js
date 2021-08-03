// Magic wand support for scratch
//
// Copyright (C) 2021 Yoav Weiss (weiss.yoav@gmail.com)

// https://sheeptester.github.io/scratch-gui/?load_plugin=https://192.168.10.8:9898/wand.js

console.log("test9");

/*
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
*/

class Wand {

	constructor(runtime) {
		this.runtime = runtime;
		this.events = { 'connected':[], 'disconnected':[], 'right':[], 'left':[], 'up':[], 'down':[], 'roll_right':[], 'roll_left':[], 'held':[], 'unheld':[], 'pressed':[] };
		this.leds = {};
		this.last_state = {"effect": "Solid", "bri": 0, "ay": 0, "held": false, "gz": 0, "az": 0, "upper_touched": false, "opposite_touched": false, "gx": 0, "ax": 0, "y_orientation": 0, "gy": 0, "mode": -1};
		this.last_seen = -1;
		this.url = 'https://192.168.10.8:9898/';
		this.loaded = false;
		this.testhat = false;
		this.testhatCtrs = {false:0,true:0};
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
		}).then(res => res.json()).then(res => callback(res, this)).catch(error => {
			console.log(error);
			callback({"last_seen": 9999, "events": [{"effect": "Solid", "motion": "none", "bri": 0, "ay": 0, "held": false, "event": "mode", "gz": 0, "az": 0, "upper_touched": false, "opposite_touched": false, "gx": 0, "ax": 0, "y_orientation": 0, "gy": 0, "mode": -1}], "last_state": {"effect": "Solid", "bri": 0, "ay": 0, "held": false, "gz": 0, "az": 0, "upper_touched": false, "opposite_touched": false, "gx": 0, "ax": 0, "y_orientation": 0, "gy": 0, "mode": -1}, "error":error}, this);
		});
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
			wand.last_seen = data.last_seen;
			wand.last_state = data.last_state;
			while (data.events.length > 0) {
				var ev = data.events.shift();
				//console.log(ev);
				//console.log(ev.event);
				switch (ev.event) {
					case "mode":
						if (ev.mode == 2) {
							console.log('connected');
							wand.events.connected.push(ev);
						} else {
							console.log('disconnected');
							wand.events.disconnected.push(ev);
						}
						break;
					case "motion":
						switch (ev.motion) {
							case "right":
								console.log('right');
								wand.events.right.push(ev);
								break;
							case "left":
								console.log('left');
								wand.events.left.push(ev);
								break;
							case "up":
								console.log('up');
								wand.events.up.push(ev);
								break;
							case "down":
								console.log('down');
								wand.events.down.push(ev);
								break;
							case "roll_right":
								console.log('roll_right');
								wand.events.roll_right.push(ev);
								break;
							case "roll_left":
								console.log('roll_left');
								wand.events.roll_left.push(ev);
								break;
						}
						break;
					case "held":
						if (ev.held) {
							console.log('held');
							wand.events.held.push(ev);
						} else {
							console.log('unheld');
							wand.events.unheld.push(ev);
						}
						break;
					case "upper_touch_pressed":
						console.log('pressed');
						wand.events.pressed.push(ev);
						break;
				}
			}
			return;
		});
	}

	connected() {
		return this.events.connected.shift() != undefined;
	}

	disconnected() {
		return this.events.disconnected.shift() != undefined;
	}

	right() {
		var ret = this.events.right.shift() != undefined;
		if (ret)
			console.log("Right triggered");
		return ret;
	}

	left() {
		var ret = this.events.left.shift() != undefined;
		if (ret)
			console.log("Left triggered");
		return ret;
	}

	up() {
		return this.events.up.shift() != undefined;
	}

	down() {
		return this.events.down.shift() != undefined;
	}

	roll_right() {
		return this.events.roll_right.shift() != undefined;
	}

	roll_left() {
		return this.events.roll_left.shift() != undefined;
	}

	held() {
		return this.events.held.shift() != undefined;
	}

	unheld() {
		return this.events.unheld.shift() != undefined;
	}

	pressed() {
		return this.events.pressed.shift() != undefined;
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

	setEffect({EFFECT,SPEED}) {
		var data = {'proxy':'effect', 'effect':EFFECT, 'speed':SPEED};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	setBrightness({BRI}) {
		var data = {'proxy':'bri', 'bri':BRI};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	setLedsState({ON}) {
		var data = {'proxy':'on', 'on':ON};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	setWandColor({COLOR}) {
		var data = {'proxy':'color', 'color':COLOR};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	setLeds({LED,COLOR}) {
		if (parseInt(LED) > 125) {
			console.log("Only 126 leds allowed");
			return;
		}
		this.leds[LED] = COLOR;
	}

	resetLeds() {
		this.leds = {};
	}

	sendLeds() {
		var data = {'proxy':'leds', 'leds':this.leds};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	toggleLight() {
		var data = {'proxy':'toggleLight'};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	fanOn() {
		var data = {'proxy':'fanOn'};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
	}

	fanOff() {
		var data = {'proxy':'fanOff'};
		return fetch(this.url+'cmd', {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(res => res.json()).then(res => console.log(res)).catch(error => console.log(error));
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

/*
	testHatTrigger() {
		console.log("triggering testhat");
		this.testhat = true;
	}

	testHat() {
		this.testhatCtrs[this.testhat]++;
		if (this.testhat) {
			console.log("testhat triggered");
			this.testhat = false;
			return true;
		} else {
			return false;
		}
	}

	testHatBoolean() {
		console.log("testing testhat: ", this.testhat, this.testhatCtrs);
		return this.testhat;
	}
*/

	getInfo() {
		return {
			id: 'wand',
			name: 'Wand',

			blocks: [
				{
					opcode: 'getEvents',

					blockType: "hat",

					text: 'get events from the wand at [URL]',
					arguments: {
						URL: {
								type: "string",
								defaultValue: 'https://192.168.10.8:9898/'
						}
					}
				},
				{
					opcode: 'connected',

					blockType: "hat",

					text: 'wand connected',
					arguments: {}
				},
				{
					opcode: 'disconnected',

					blockType: "hat",

					text: 'wand disconnected',
					arguments: {}
				},
				{
					opcode: 'right',

					blockType: "hat",

					text: 'wand swished right',
					arguments: {}
				},
				{
					opcode: 'left',

					blockType: "hat",

					text: 'wand swished left',
					arguments: {}
				},
				{
					opcode: 'up',

					blockType: "hat",

					text: 'wand swished up',
					arguments: {}
				},
				{
					opcode: 'down',

					blockType: "hat",

					text: 'wand swished down',
					arguments: {}
				},
				{
					opcode: 'roll_right',

					blockType: "hat",

					text: 'wand rolled right',
					arguments: {}
				},
				{
					opcode: 'roll_left',

					blockType: "hat",

					text: 'wand rolled left',
					arguments: {}
				},
				{
					opcode: 'held',

					blockType: "hat",

					text: 'wand picked up',
					arguments: {}
				},
				{
					opcode: 'unheld',

					blockType: "hat",

					text: 'wand put down',
					arguments: {}
				},
				{
					opcode: 'pressed',

					blockType: "hat",

					text: 'wand upper touch pressed',
					arguments: {}
				},
				{
					opcode: 'mode',

					blockType: "reporter",

					text: 'get wand mode',
					arguments: {
					}
				},
				{
					opcode: 'effect',

					blockType: "reporter",

					text: 'get wand effect',
					arguments: {
					}
				},
				{
					opcode: 'bri',

					blockType: "reporter",

					text: 'get wand brightness',
					arguments: {
					}
				},
				{
					opcode: 'ax',

					blockType: "reporter",

					text: 'get accelerometer x',
					arguments: {
					}
				},
				{
					opcode: 'ay',

					blockType: "reporter",

					text: 'get accelerometer y',
					arguments: {
					}
				},
				{
					opcode: 'az',

					blockType: "reporter",

					text: 'get accelerometer z',
					arguments: {
					}
				},
				{
					opcode: 'gx',

					blockType: "reporter",

					text: 'get gyro x',
					arguments: {
					}
				},
				{
					opcode: 'gy',

					blockType: "reporter",

					text: 'get gyro y',
					arguments: {
					}
				},
				{
					opcode: 'gz',

					blockType: "reporter",

					text: 'get gyro z',
					arguments: {
					}
				},
				{
					opcode: 'isHeld',

					blockType: "Boolean",

					text: 'is the wand held?',
					arguments: {
					}
				},
				{
					opcode: 'isConnected',

					blockType: "Boolean",

					text: 'is the wand connected?',
					arguments: {
					}
				},
				{
					opcode: 'isUpperTouched',

					blockType: "Boolean",

					text: 'is the upper touchpad touched?',
					arguments: {
					}
				},
				{
					opcode: 'isUp',

					blockType: "Boolean",

					text: 'is the wand pointed up?',
					arguments: {
					}
				},
				{
					opcode: 'isDown',

					blockType: "Boolean",

					text: 'is the wand pointed down?',
					arguments: {
					}
				},
				{
					opcode: 'isLevel',

					blockType: "Boolean",

					text: 'is the wand level?',
					arguments: {
					}
				},
				{
					opcode: 'setEffect',

					blockType: "command",

					text: 'set wand effect to [EFFECT] with speed [SPEED]',
					arguments: {
						EFFECT: {
								type: "string",
								menu: "effects",
								defaultValue: "Rainbow"
						},
						SPEED: {
								type: "number",
								defaultValue: 128
						}
					}
				},
				{
					opcode: 'setBrightness',

					blockType: "command",

					text: 'set wand brightness to [BRI]',
					arguments: {
						BRI: {
								type: "number",
								defaultValue: 100
						}
					}
				},
				{
					opcode: 'setLedsState',

					blockType: "command",

					text: 'set leds state [ON]',
					arguments: {
						ON: {
								type: "boolean",
								menu: "on",
								defaultValue: "on"
						}
					}
				},
				{
					opcode: 'setWandColor',

					blockType: "command",

					text: 'set the wand color to [COLOR]',
					arguments: {
						COLOR: {
								type: "color",
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'setLeds',

					blockType: "command",

					text: 'set the color of [LED] to [COLOR]',
					arguments: {
						LED: {
								type: "number",
								menu: "leds",
								defaultValue: 0
						},
						COLOR: {
								type: "color",
								defaultValue: ''
						}
					}
				},
				{
					opcode: 'resetLeds',

					blockType: "command",

					text: 'reset all leds',
					arguments: {
					}
				},
				{
					opcode: 'sendLeds',

					blockType: "command",

					text: 'send the led colors to the wand',
					arguments: {
					}
				},
				{
					opcode: 'toggleLight',

					blockType: "command",

					text: 'toggle the light',
					arguments: {
					}
				},
				{
					opcode: 'fanOn',

					blockType: "command",

					text: 'turn on the fan',
					arguments: {
					}
				},
				{
					opcode: 'fanOff',

					blockType: "command",

					text: 'turn off the fan',
					arguments: {
					}
				},
				{
					opcode: 'when_loaded',

					blockType: "hat",

					text: 'Extension loaded',
					arguments: {}
				},
/*
				{
					opcode: 'testHat',

					blockType: "hat",

					text: 'test hat',
					arguments: {}
				},
				{
					opcode: 'testHatBoolean',

					blockType: "Boolean",

					text: 'test hat boolean',
					arguments: {}
				},
				{
					opcode: 'testHatTrigger',

					blockType: "command",

					text: 'trigger the test hat',
					arguments: {}
				},
*/
				{
					opcode: 'scratchLog',

					blockType: "command",

					text: 'log [l1] [l2] [l3]',
					arguments: {
						l1: {
								type: "string",
								defaultValue: ''
						},
						l2: {
								type: "string",
								defaultValue: ''
						},
						l3: {
								type: "string",
								defaultValue: ''
						}
					}
				}
			],
			'menus': {
				'effects': {
					acceptReporters: true,
					items: [
						"Solid","Blink","Breathe","Wipe","Wipe Random","Random Colors","Sweep","Dynamic","Colorloop","Rainbow",
						"Scan","Scan Dual","Fade","Theater","Theater Rainbow","Running","Saw","Twinkle","Dissolve","Dissolve Rnd",
						"Sparkle","Sparkle Dark","Sparkle+","Strobe","Strobe Rainbow","Strobe Mega","Blink Rainbow","Android","Chase","Chase Random",
						"Chase Rainbow","Chase Flash","Chase Flash Rnd","Rainbow Runner","Colorful","Traffic Light","Sweep Random","Running 2","Red & Blue","Stream",
						"Scanner","Lighthouse","Fireworks","Rain","Merry Christmas","Fire Flicker","Gradient","Loading","Police","Police All",
						"Two Dots","Two Areas","Circus","Halloween","Tri Chase","Tri Wipe","Tri Fade","Lightning","ICU","Multi Comet",
						"Scanner Dual","Stream 2","Oscillate","Pride 2015","Juggle","Palette","Fire 2012","Colorwaves","Bpm","Fill Noise",
						"Noise 1","Noise 2","Noise 3","Noise 4","Colortwinkles","Lake","Meteor","Meteor Smooth","Railway","Ripple",
						"Twinklefox","Twinklecat","Halloween Eyes","Solid Pattern","Solid Pattern Tri","Spots","Spots Fade","Glitter","Candle","Fireworks Starburst",
						"Fireworks 1D","Bouncing Balls","Sinelon","Sinelon Dual","Sinelon Rainbow","Popcorn","Drip","Plasma","Percent","Ripple Rainbow",
						"Heartbeat","Pacifica","Candle Multi", "Solid Glitter","Sunrise","Phased","Twinkleup","Noise Pal", "Sine","Phased Noise",
						"Flow","Chunchun"
					]
				},
				'on': {
					acceptReporters: true,
					items: ["on","off"]
				},
				'leds': {
					acceptReporters: true,
					items: Array(126). fill(). map((_, idx) => String(idx))
				}
			}
		}
	}
}

//Scratch.extensions.register(new Wand());

(function() {
    var extensionInstance = new Wand(window.vm.extensionManager.runtime)
    var serviceName = window.vm.extensionManager._registerInternalExtension(extensionInstance)
    window.vm.extensionManager._loadedExtensions.set(extensionInstance.getInfo().id, serviceName)
})()

