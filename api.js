var tilelive = require('@mapbox/tilelive');
var MBTiles = require('@mapbox/mbtiles');
require('tilelive-http')(tilelive);
require("@mapbox/mbtiles").registerProtocols(tilelive);
var util = require('util');
var request = require('request');
var conf = require('./config.js');
var hlprs = require('./helpers.js');
var exports = module.exports = {};
var childProcess = require('child_process');

exports.getMbtiles = function(tileUrl, mbtilesFile, minzoom, maxzoom, bounds, metadata, logOutput, callback) {
  var options = {
    type: 'scanline',
    minzoom: parseInt(minzoom, 10),
    maxzoom: parseInt(maxzoom, 10),
    bounds: bounds.toString().split(',').map(function(v) { return parseFloat(v); }),
    close: true,
    progress: ((logOutput == true) ? hlprs.report : false),
    concurrency: conf.concurrency
  };
  tilelive.copy(tileUrl, 'mbtiles://' + mbtilesFile, options, function(err){
    if (err)
      return callback(err);
    new MBTiles(mbtilesFile + '?mode=rw', function(err, mbtiles) {
      if (err)
        return callback(err);
      mbtiles.startWriting(function(err) {
        if (err)
          return callback(err);
        var mbtilesMetadata = {
          minzoom: options.minzoom,
          maxzoom: options.maxzoom,
          bounds: options.bounds,
          format: 'pbf',
          name: 'mobile-tile-packager',
          json: JSON.stringify({vector_layers: metadata.layers})
        };
        mbtiles.putInfo(mbtilesMetadata, function(err) {
          if (err)
            return callback(err);
          mbtiles.stopWriting(callback);
        });
      });
    });
  });
}

exports.inst_pub = function(username, template, callback) {
  var err404 = function(err) {
    return callback(new Error(err));
  }
  request.post({url: conf.inst_url.replace('{username}', username).replace('{template}', template),
          headers: {'Content-Type': 'application/json'}}, function(err, req, resp) {
    if (err) err404(err.message);
    try {
      var inst = JSON.parse(resp);
      if (!inst.layergroupid) {
        err404('Instantiate response is empty. (Possibly wrong username or template)');
      }
      else {
        console.log('%s USER:%s, TEMPLATE:%s, LAYERGROUPID:%s, Instantiate was successful.', hlprs.currdatetime(), username, template, inst.layergroupid);
        return callback(null, inst.layergroupid, inst.metadata);
      }
    }
    catch (e) {
      err404(e);
    }
  });
}

exports.inst_priv = function(username, template, callback) {
  var err404 = function(err) {
    return callback(new Error(err));
  }
  request.get({url: conf.inst_url.replace('{username}', username).replace('{template}', template)}, function(err, req, resp) {
    if (err) err404(err.message);
    try {
      var inst = JSON.parse(resp);
      if (!inst.template) {
        err404('Map template response is empty. (Possibly wrong username, template or api_key)');
      }
      else {
        request.post({url: conf.map_url.replace('{username}', username),
                headers: {'Content-Type': 'application/json'}, body: JSON.stringify(inst.template.layergroup)}, function(err, req, resp) {
          if (err) err404(err.message);
          var inst = JSON.parse(resp);
          if (!inst.layergroupid) {
            err404('Layergroup response is empty. (Possibly wrong username, template or api_key)');
          }
          else {
            console.log('%s USER:%s, TEMPLATE:%s, LAYERGROUPID:%s, Get map template was successful.', hlprs.currdatetime(), username, template, inst.layergroupid);
            return callback(null, inst.layergroupid, inst.metadata);
          }
        });
      }
    }
    catch (e) {
      err404(e);
    }
  });
}

exports.getGeoJSON = function(url) {
  return request.get({url: url, headers: {'Content-Type': 'application/json'}});
}

exports.ExecTippecanoe = function(mbtilesFile, geoJSONFile, minzoom, maxzoom, callback) {
  var cmd = conf.tippe.replace('{mbtiles_file}', mbtilesFile).replace('{geojson_file}', geoJSONFile).replace('{minzoom}', minzoom).replace('{maxzoom}', maxzoom);
  console.log('Process started - %s', cmd);
  var pr = childProcess.exec(cmd, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
      return callback(error);
    }
    if (stderr) {
      console.log(stderr);
    }
    if (stdout) {
      console.log(stdout);
    }
  });

  pr.on('exit', function (code) {
    //console.log('Process exited with exit code %s', code);
    return callback(null, code);
  });
}
