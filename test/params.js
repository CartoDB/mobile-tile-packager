'use strict';
 
var conf = require('../config.js');
var options = {
  minzoom: '0',
  maxzoom: '18',
  bounds: '-121.951997,37.322666,-121.937599,37.328007', 
  username: 'carto_username',
  template: 'tpl_9bfaa116_...',
  layergroupid: 'carto_username@3a6...',
  tilesfileMapsAPI: conf.output + '/test_maps_api.mbtiles',
  tilesfileSQLAPI: conf.output + '/test_sql_api.mbtiles',
  geoJsonFile: conf.output + '/test.geojson',
  sql: 'your-select-query',
  logOutput: false
};

module.exports.options = options;

