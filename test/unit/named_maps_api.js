'use strict';

var fs = require('fs'); 
var conf = require('../../config.js');
var api = require('../../api.js');
var hlprs = require('../../helpers.js');
var assert = require('assert');
var params = require('../params.js');

describe('Named Maps API test...', function() { 
  before(function() {
    if (hlprs.fileExists(params.options.tilesfileMapsAPI)) {
      fs.unlink(params.options.tilesfileMapsAPI, function(err){
        if(err) throw err;
      });
    }
  });
  
  var tileurl = conf.tile_url.replace('{username}', params.options.username).replace('{layergroupid}', params.options.layergroupid);
  
  it('should download tiles and create ' + params.options.tilesfileMapsAPI + ' file', function(cb) {      
    api.getMbtiles(tileurl, params.options.tilesfileMapsAPI, params.options.minzoom, params.options.maxzoom, params.options.bounds, params.options.logOutput, function(err){
      if (err) cb(err);      
      else cb();
    });
  });
    
  it('file ' + params.options.tilesfileMapsAPI + ' should exsits and greater than 0 bytes', function() {      
    assert.notEqual(hlprs.fileExists(params.options.tilesfileMapsAPI), 0);
  });
  
  after(function() {
    if (hlprs.fileExists(params.options.tilesfileMapsAPI)) {
      fs.unlink(params.options.tilesfileMapsAPI, function(err){
        if(err) throw err;
      });
    }
  });
  
});
