'use strict';
 
var conf = require('../config.js');
var options = {
  minzoom: '10',
  maxzoom: '10',
  bounds: '-3.792343,40.344451,-3.576736,40.487693', 
  username: 'nutiteq',
  template: 'tpl_f1407ed4_84b8_11e6_96bc_0ee66e2c9693',
  tilesfileMapsAPI: conf.output + '/test_maps_api.mbtiles',
  tilesfileSQLAPI: conf.output + '/test_sql_api.mbtiles',
  geoJsonFile: conf.output + '/test.geojson',
  sql: 'select * from cities15000',
  logOutput: false
};

module.exports.options = options;

