'use strict';

const models = require('./models');

var SERVICE = process.env.SERVICE;

function log(msg) {
    console.log(msg);
}

if (!SERVICE) {
    log('SERVICE environment variable is not set!');
    process.exit(1);
}

function waitForDb(cb) {
    log("Wait for db..");
    models.sequelize.authenticate().then(() => {
        cb();
    }).catch(() => {
        setTimeout(() => {
            waitForDb(cb);
        }, 2000);
    });
}

waitForDb(main);

function main() {
    models.Station.findAll().then((items) => {
        log('found items:' + items.length);
    });
}
