'use strict';

const colors = require('colors');
const util = require('util');

var level = process.env.LOG_LEVEL || 3;

function decodeError(obj) {
    if (obj) {
        if (typeof obj === 'object') {
            return util.inspect(obj);
        }
    }
    return '' + obj;
}

function getTimeString() {
    return (new Date()).toISOString().white.italic;
}

function trace(msg) {
    if (level > 4) {
        msg = decodeError(msg);
        console.log(getTimeString() + ' ' + msg.grey);
    }
}

function debug(msg) {
    if (level > 3) {
        msg = decodeError(msg);
        console.log(getTimeString() + ' ' + msg.white);
    }
}

function info(msg) {
    if (level > 2) {
        msg = decodeError(msg);
        console.log(getTimeString() + ' ' + msg.green);
    }
}

function warn(msg) {
    if (level > 1) {
        msg = decodeError(msg);
        console.log(getTimeString() + ' ' + msg.yellow);
    }
}

function error(msg) {
    if (level > 0) {
        msg = decodeError(msg);
        console.log(getTimeString() + ' ' + msg.red);
    }
}

module.exports = {
    trace: trace,
    debug: debug,
    info: info,
    warn: warn,
    error: error
};
