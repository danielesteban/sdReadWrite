#!/usr/local/bin/node

var argv = require('optimist')
	.usage('Usage: $0 W|R filename [-p path] [--serial serialPort]')
    .default('p', '/')
    //.default('serial', '/dev/tty.usbserial-AH01KY16')
    .default('serial', '/dev/tty.usbmodem621')
    .check(function(argv) {
    	argv._[0] = (argv._[0] + '').toUpperCase();
    	if(['W', 'R'].indexOf(argv._[0]) === -1) throw new Error('Mode should be W or R');
    	if(argv._.length < 2) throw new Error('You must specify a filename');
    })
    .argv;

var SerialPort = require('serialport'),
	fs = require('fs'),
	serial = new SerialPort.SerialPort(argv.serial, {
		buffersize: 512,
		baudrate: 115200
	}),
	mode = argv._.shift(),
	files = argv._,
	path = argv.p + (argv.p[argv.p.length - 1] != '/' ? '/' : ''),
	filename, basename,
	connected = false,
	queue = [],
	q_percent,
	writeStream,
	buffer,
	size = null,
	lastTick,
	kbs = [],
	kbs_s = 0,
	kbs_c = 0,
	kbs_n;

console.log("Waiting for the arduino to connect...");

serial.on('data', function (data) {
	if(!connected) startTransfer()
	else {
		switch(mode) {
			case 'W':
				if(queue.length) return writeQueue();
				console.log(data[0] == 1 ? "Done!" : "Something bad happened...");
				startTransfer();
			break;
			case 'R':
				if(!buffer) buffer = data;
				else buffer = Buffer.concat([buffer, data]);
				if(size === null) {
					if(buffer.length < 3) return;
					size = buffer[0] + (buffer[1] << 8) + (buffer[2] << 16);
					kbs_n = (size / 512 / 40) || 1;
					q_percent = 100 / (size / 512);
					buffer = buffer.slice(3);
					serial.write(new Buffer([0]));
				}
				if(size > 0) {
					var bufferSize = size > 512 ? 512 : size;
					if(buffer.length < bufferSize) return;
					writeStream.write(buffer.slice(0, bufferSize));
					buffer = buffer.slice(bufferSize);
					size -= bufferSize;
					serial.write(new Buffer([0]));
					process.stdout.write('\u001B[2J\u001B[0;0f');
					console.log("Reading " + basename + ": " + addZero((100 - ((size / 512) * q_percent)).toFixed(2)) + "%... " + getKBytesSec());
				} else {
					writeStream.end();
					console.log(data[0] == 1 ? "Done!" : "Something bad happened...");
					startTransfer();
				}
		}
	}
});

function startTransfer() {
	if(!files.length) return process.exit();
	filename = files.shift();
	basename = require('path').basename(filename);
	serial.write(path + basename + "\n");
	serial.write(new Buffer([mode == 'W' ? 0 : 1]));
	switch(mode) {
		case 'W':
			fs.stat(filename, function (err, stats) {
				size = stats.size;
				kbs_n = (size / 512 / 40) || 1;
				var f = fs.createReadStream(filename, {bufferSize: 512});
				f.on('data', function(data) {
					queue.push(data);
				});
				f.on('end', function(data) {
					queue.push(new Buffer([0]));
					q_percent = 100 / queue.length;
					serial.write(new Buffer([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xffff]));
				});
			});
		break;
		case 'R':
			writeStream = fs.createWriteStream('./downloads/' + basename, {bufferSize: 512});
	}
	connected = true;
	lastTick = (new Date()).getTime();
}

function writeQueue() {
	serial.write(queue.shift());
	process.stdout.write('\u001B[2J\u001B[0;0f');
	console.log("Writing " + basename + ": " + addZero((100 - (queue.length * q_percent)).toFixed(2)) + "%... " + getKBytesSec());	
}

function getKBytesSec() {
	var now = (new Date()).getTime();
	kbs[kbs_c] && (kbs_s -= kbs[kbs_c]);
	kbs[kbs_c] = 0.5 / ((now - lastTick) / 1000);
	kbs_s += kbs[kbs_c];
	kbs_c++;
	kbs_c >= kbs_n && (kbs_c = 0);
	lastTick = now;
	var avg = (kbs_s / kbs_n).toFixed(2);
	return avg > 0 ? "(" + avg + "kb/s)": '';
}

function addZero(str) {
	str = str + '';
	return (str.length < 5 ? '0' : '') + str;
}
