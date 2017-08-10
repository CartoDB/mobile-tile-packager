'use strict';
 
var conf = require('../config.js');
var options = {
  minzoom: '0',
  maxzoom: '18',
  bounds: '-121.951997,37.322666,-121.937599,37.328007', 
  username: 'nutiteq',
  template: 'tpl_f1407ed4_84b8_11e6_96bc_0ee66e2c9693',
  layergroupid: 'nutiteq@f1407ed4_84b8_11e6_96bc_0ee66e2c9693',
  tilesfileMapsAPI: conf.output + '/test_maps_api.mbtiles',
  tilesfileSQLAPI: conf.output + '/test_sql_api.mbtiles',
  geoJsonFile: conf.output + '/test.geojson',
  sql: 'select * from cities15000',
  logOutput: false
};

module.exports.options = options;

