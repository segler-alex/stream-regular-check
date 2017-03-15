'use strict';

const models = require('./models');
const request = require('request-promise-native');
const async = require('async');
const colors = require('colors');

var SERVICE = process.env.SERVICE;
var CONCURRENCY = process.env.CONCURRENCY || 1;

var q = async.queue(streamWorker, CONCURRENCY);
q.drain = drainedQueue;

function log(msg) {
    console.log((new Date()).toISOString().green + ' ' + msg.grey);
}

function logErr(msg) {
    console.log((new Date()).toISOString().green + ' ' + msg.red);
}

if (!SERVICE) {
    logErr('SERVICE environment variable is not set!');
    process.exit(1);
}

function drainedQueue() {
    enqueueStations();
}

function saveStreamInfo(id, result) {
    var values = {};
    values.LastCheckTime = new Date();
    if (result) {
        values.LastCheckOK = true;
        values.LastCheckOKTime = new Date();
    } else {
        values.LastCheckOK = false;
    }
    return models.Station.update(values, {
        where: {
            StationID: id
        }
    });
}

function streamWorker(task, cb) {
    log('Started stream check: ' + task.url);
    var result;
    checkStream(task.id, task.url, false).then((_result) => {
        result = _result;
        return null;
    }).catch((err) => {
        logErr('Failed stream check: ' + task.url + '   ' + err);
    }).then(() => {
        log('Saving stream check ok: ' + task.url);
        return saveStreamInfo(task.id, result);
    }).then(() => {
        log('Finished stream check: ' + task.url);
        cb();
    });
}

function checkStream(id, url, multi) {
    var r = request.post({
        url: multi ? 'http://' + SERVICE + '/checkall' : 'http://' + SERVICE + '/check',
        json: {
            url: url
        }
    }).then((result) => {
        return {
            id: id,
            url: url,
            multi: multi,
            result: result
        };
    });
    return r;
}

function waitForDb(cb) {
    log('Wait for db..');
    models.sequelize.authenticate().then(() => {
        cb();
    }).catch((err) => {
        setTimeout(() => {
            waitForDb(cb);
        }, 2000);
    });
}

function enqueueStations() {
    models.Station.findAll({
        where: {
            LastCheckTime: {
                $lt: new Date(new Date() - 24 * 60 * 60 * 1000)
            }
        },
        order: [
            ['LastCheckTime', 'ASC']
        ],
        limit: 10
    }).then((items) => {
        if (items.length > 0) {
            log('Found new items:' + items.length);
            for (var i = 0; i < items.length; i++) {
                q.push({
                    id:items[i].StationID,
                    url:items[i].Url
                });
            }
        } else {
            log('Found NO new items. Waiting 60 secs..');
            setTimeout(enqueueStations, 60 * 1000);
        }
    });
}

function main() {
    enqueueStations();
}

waitForDb(main);
