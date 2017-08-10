'use strict';

var fs = require('fs'); 
var conf = require('../../config.js');
var api = require('../../api.js');
var hlprs = require('../../helpers.js');
var assert = require('assert');
var params = require('../params.js');

describe('SQL API test...', function() { 
  before(function() {
    if (hlprs.fileExists(params.options.geoJsonFile)) {
      fs.unlink(params.options.geoJsonFile, function(err){
        if(err) throw err;
      });
    }
    if (hlprs.fileExists(params.options.tilesfileSQLAPI)) {
      fs.unlink(params.options.tilesfileSQLAPI, function(err){
        if(err) throw err;
      });
    }
  });
  it('should download GeoJSON ' + params.options.geoJsonFile + ' file', function(cb) {      
    var request = api.getGeoJSON(conf.sql_api_url.replace('{username}', params.options.username).replace('{sql}', params.options.sql)
                .replace('{minzoom}', params.options.minzoom).replace('{maxzoom}', params.options.maxzoom)).pipe(fs.createWriteStream(params.options.geoJsonFile));
      
    request.on('error', function(err) {
      cb(err);
    });
    
    request.on('close', function() {     
      cb();
    });   
  });
      
  it('file ' + params.options.geoJsonFile + ' should exsits and greater than 0 bytes', function() {      
    assert.notEqual(hlprs.fileExists(params.options.geoJsonFile), 0);
  });
         
  it('should make mbtiles ' + params.options.tilesfileSQLAPI + ' file', function(cb) {      
    api.ExecTippecanoe(params.options.tilesfileSQLAPI, params.options.geoJsonFile, params.options.minzoom, params.options.maxzoom, function(err, exit_code){    
      if (err) cb(err);      
      else cb();
    });
  });
  
  after(function() {
    if (hlprs.fileExists(params.options.geoJsonFile)) {
      fs.unlink(params.options.geoJsonFile, function(err){
        if(err) throw err;
      });
    }
    if (hlprs.fileExists(params.options.tilesfileSQLAPI)) {
      fs.unlink(params.options.tilesfileSQLAPI, function(err){
        if(err) throw err;
      });
    }
  });
});



