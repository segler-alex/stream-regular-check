'use strict';

const models = require('./models');
const request = require('request-promise-native');
const async = require('async');
const log = require('./log.js');

var SERVICE = process.env.SERVICE;
var CONCURRENCY = process.env.CONCURRENCY || 1;

var q = async.queue(streamWorker, CONCURRENCY);
q.drain = drainedQueue;

if (!SERVICE) {
    log.error('SERVICE environment variable is not set!');
    process.exit(1);
}

function drainedQueue() {
    enqueueStations();
}

function saveStreamInfo(id, result) {
    var values = {};
    values.LastCheckTime = new Date();
    values.LastCheckOK = false;
    if (result) {
        if (result.ok){
            if (result.streams.length > 0){
                values.LastCheckOK = true;
                values.LastCheckOKTime = new Date();
                var stream = result.streams[0];
                values.Codec = stream.codec;
                values.Bitrate = stream.bitrate;
                values.UrlCache = stream.url;
            }
        }
    }
    return models.Station.update(values, {
        where: {
            StationID: id
        }
    });
}

function streamWorker(task, cb) {
    log.info('Started stream check: ' + task.url);
    var result;
    checkStream(task.id, task.url, false).then((_result) => {
        result = _result;
        log.trace(JSON.stringify(result, null, ' '));
        return null;
    }).catch((err) => {
        log.error('Failed stream check: ' + task.url + '   ' + err);
    }).then(() => {
        log.debug('Saving stream check ok: ' + task.url);
        return saveStreamInfo(task.id, result);
    }).then(() => {
        log.info('Finished stream check: ' + task.url);
        setTimeout(cb, 10000);
    });
}

function checkStream(id, url, multi) {
    var r = request.post({
        url: multi ? 'http://' + SERVICE + '/checkall' : 'http://' + SERVICE + '/check',
        json: {
            url: url
        }
    }).then((result) => {
        result.id = id;
        result.url = url;
        result.multi = multi;
        return result;
    });
    return r;
}

function waitForDb(cb) {
    log.info('Wait for db..');
    models.sequelize.authenticate().then(() => {
        cb();
    }).catch(() => {
        setTimeout(() => {
            waitForDb(cb);
        }, 2000);
    });
}

function waitForStreamChecker(cb) {
    log.info('Wait for stream-check..');
    request.post({
        url: 'http://' + SERVICE + '/status',
        json: {}
    }).then(() => {
        cb();
    }).catch(() => {
        setTimeout(() => {
            waitForStreamChecker(cb);
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
            log.info('Found new items:' + items.length);
            for (var i = 0; i < items.length; i++) {
                q.push({
                    id: items[i].StationID,
                    url: items[i].Url
                });
            }
        } else {
            log.info('Found NO new items. Waiting 60 secs..');
            setTimeout(enqueueStations, 60 * 1000);
        }
    });
}

function main() {
    enqueueStations();
}

waitForDb(() => {
    waitForStreamChecker(() => {
        main();
    });
});
