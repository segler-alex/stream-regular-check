'use strict';

module.exports = function(sequelize, DataTypes) {
    var Station = sequelize.define('Station', {
        StationID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Name: DataTypes.STRING,
        Url: DataTypes.STRING,
        Homepage: DataTypes.STRING,
        Favicon: DataTypes.STRING,
        Creation: DataTypes.NOW,
        Country: DataTypes.STRING,
        Language: DataTypes.STRING,
        Tags: DataTypes.STRING,
        Votes: DataTypes.INTEGER,
        Subcountry: DataTypes.STRING,
        clickcount: DataTypes.INTEGER,
        ClickTrend: DataTypes.INTEGER,
        ClickTimestamp: DataTypes.DATE,
        Hls: DataTypes.BOOLEAN,
        Codec: DataTypes.STRING,
        LastCheckOK: DataTypes.BOOLEAN,
        LastCheckTime: DataTypes.DATE,
        Bitrate: DataTypes.INTEGER,
        UrlCache: DataTypes.STRING,
        LastCheckOKTime: DataTypes.DATE
    }, {
        classMethods: {
            associate: function(models) {
            }
        },
        tableName: 'Station'
    });
    return Station;
};
