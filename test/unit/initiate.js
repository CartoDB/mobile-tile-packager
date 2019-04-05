'use strict';

var conf = require('../../config.js');
var api = require('../../api.js');
var params = require('../params.js');
var assert = require('assert');

describe('Instantiate test...', function() {
  var url = conf.inst_url.replace('{username}', params.options.username).replace('{template}', params.options.template)

  it('should return layergroupid', function(cb) {
    api.inst_pub(params.options.username, params.options.template, function(err, layerId, meta){
      if (err) cb(err);
      else {
        assert(layerId);
        cb();
      }
    });
  });
});
