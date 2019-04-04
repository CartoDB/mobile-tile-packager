var fs = require('fs'),
    p = require('path');
var archiver = require('archiver');
var conf = require('./config.js');
var hlprs = require('./helpers.js');
var crypto = require('crypto');
var api = require('./api.js');
var express = require('express'),
    bodyParser = require('body-parser'),
    service = express();
var kue = require('kue');
var queue = kue.createQueue({
  prefix: conf.kue_redis_prefix,
  redis: {
    port: conf.kue_redis_port,
    host: conf.kue_redis_host,
    //db: 3, // if provided select a non-default redis db
  }
});

function getTiles(job_id, username, template, minzoom, maxzoom, bounds, cb) {
  function err404(err) {
    if (!('toJSON' in Error.prototype)) {
      Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
          var alt = {};
          Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
          }, this);
          return alt;
        },
        configurable: true,
        writable: true
      });
    }
    var error = new Error(err);
    error.time = hlprs.currdatetime();
    error.user = username;
    error.template = template;
    console.error('%s JOB:%s, USER:%s, TEMPLATE:%s, ERROR:%s', hlprs.currdatetime(), job_id, username, template, err);
    return cb(error);
  }

  if (conf.private) {
    api.inst_priv(username, template, OnInstantiate);
  } else {
    api.inst_pub(username, template, OnInstantiate);
  }

  function OnInstantiate(err, layerId, meta) {
    if (err) err404(err);
    var mbTilesFile = conf.output + '/' + username + '_' + job_id + '.mbtiles';
    var layersFile = conf.output + '/' + username + '_' + job_id+ '.layers.json';
    var zipFile = conf.output + '/' + username + '_' + job_id + '.zip';

    api.getMbtiles(conf.tile_url.replace('{username}', username).replace('{layergroupid}', layerId),
                mbTilesFile, minzoom, maxzoom, bounds, meta, conf.report_log, onGetMbtiles);

    function onGetMbtiles(err) {
      if (err) err404(err.message);
      var archive = archiver('zip');
      fs.appendFile(layersFile, JSON.stringify(meta), function AchiveMbtiles(err){
        if(err) err404(err.message);
        var files = [mbTilesFile, layersFile];
        for(var i in files) {
          archive.file(files[i], { name: p.basename(files[i]) });
        }
        archive.on('error', function(err) {
          err404(err.message);
        });
        archive.on('end', function() {
          console.log('%s USER:%s, Archive wrote %d bytes.', hlprs.currdatetime(), username, archive.pointer());
          fs.unlink(mbTilesFile, function(err){
            if(err) err404(err.message);
            fs.unlink(layersFile, function(err){
              if(err) err404(err.message);
              return cb();
            });
          });
        });
        archive.pipe(fs.createWriteStream(zipFile));
        archive.finalize();
      });
    }
  }
}

function getMbtilesBySQL(job_id, username, template, sql, minzoom, maxzoom, cb) {
  function err404(err) {
    if (!('toJSON' in Error.prototype)) {
      Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
          var alt = {};
          Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
          }, this);
          return alt;
        },
        configurable: true,
        writable: true
      });
    }
    var error = new Error(err);
    error.time = hlprs.currdatetime();
    error.user = username;
    error.sql = sql;
    console.error('%s JOB:%s, USER:%s, SQL:%s, ERROR:%s', hlprs.currdatetime(), job_id, username, sql, err);
    return cb(error);
  }

  if (conf.private) {
    api.inst_priv(username, template, OnInstantiate);
  } else {
    api.inst_pub(username, template, OnInstantiate);
  }

  function OnInstantiate(err, layerId, meta) {
    if (err) err404(err);
    var geoJSONFile = conf.output + '/' + username + '_' + job_id + '.geojson';
    var mbtilesFile = conf.output + '/' + username + '_' + job_id + '.mbtiles';
    var layersFile = conf.output + '/' + username + '_' + job_id+ '.layers.json';
    var zipFile = conf.output + '/' + username + '_' + job_id + '.zip';
    var request = api.getGeoJSON(conf.sql_api_url.replace('{username}', username).replace('{sql}', sql)
              .replace('{minzoom}', minzoom).replace('{maxzoom}', maxzoom)).pipe(fs.createWriteStream(geoJSONFile))
    request.on('error', function(err) {
      err404(err)
    });

    request.on('close', MakeMbtilesWithTC);

    function MakeMbtilesWithTC() {
      api.ExecTippecanoe(mbtilesFile, geoJSONFile, minzoom, maxzoom, OnRunningTC);

      function OnRunningTC(err, exit_code){
        if (err) err404(err);
        var archive = archiver('zip');
        fs.appendFile(layersFile, JSON.stringify(meta), AchiveMbtiles);

        function AchiveMbtiles(err){
          if(err) err404(err.message);
          var files = [mbtilesFile, layersFile];
          for(var i in files) {
            archive.file(files[i], { name: p.basename(files[i]) });
          }
          archive.on('error', function(err) {
            err404(err.message);
          });
          archive.on('end', function() {
            console.log('%s USER:%s, Archive wrote %d bytes.', hlprs.currdatetime(), username, archive.pointer());
            fs.unlink(mbtilesFile, function(err){
              if(err) err404(err.message);
              fs.unlink(layersFile, function(err){
                if(err) err404(err.message);
                fs.unlink(geoJSONFile, function(err){
                  if(err) err404(err.message);
                  return cb();
                });
              });
            });
          });
          archive.pipe(fs.createWriteStream(zipFile));
          archive.finalize();
        }
      }
    }
  }
}

service.use(bodyParser.json());
service.post('/api/v1/package_exports', function(req, res){
  var err404 = function(err) {
    console.error('%s ERROR:%s', hlprs.currdatetime(), err);
    res.status(404).setHeader('Content-Type', 'application/json');
    res.json({'errors': [{'message': err.toString()}]});
  }
  var contype = req.headers['content-type'];
  if (!contype || contype.indexOf('application/json') !== 0) {
    err404('Content-type is not json');
  }
  else if (!req.body.data.username) { err404('data.username missing') }
  else if (!req.body.data.template) { err404('data.template missing') }
  else if (!req.body.data.maxzoom || req.body.data.maxzoom < 0 || req.body.data.maxzoom > 22) { err404('data.maxzoom value must between 1 and 22') }
  else if (!req.body.data.bounds) { err404('data.bounds: "lon, lat, lon, lat"') }
  else {
    var params = {
      username: req.body.data.username,
      template: req.body.data.template,
      minzoom: req.body.data.minzoom ? req.body.data.minzoom : 0,
      maxzoom: req.body.data.maxzoom,
      bounds: req.body.data.bounds
    };
    console.log( 'creating job...');
    job = queue.create('tiles', params).save(function(err){
      if(err)
        console.error(err.message);
      else {
        res.status(200).setHeader('Content-Type', 'application/json');
        res.json({'id': job.id, 'created_at': new Date(parseInt(job.created_at))});
      }
    });
    queue.process('tiles', function(job, done){
      console.log('processing job: #%d', job.id);
      getTiles(job.id, job.data.username, job.data.template, job.data.minzoom, job.data.maxzoom, job.data.bounds, done);
    });
  }
});

service.post('/api/v1/package_exports_by_sql', function(req, res){
  var err404 = function(err) {
    console.error('%s ERROR:%s', hlprs.currdatetime(), err);
    res.status(404).setHeader('Content-Type', 'application/json');
    res.json({'errors': [{'message': err.toString()}]});
  }
  var contype = req.headers['content-type'];
  if (!contype || contype.indexOf('application/json') !== 0) {
    err404('Content-type is not json');
  }
  else if (!req.body.data.username) { err404('data.username missing') }
  else if (!req.body.data.template) { err404('data.template missing') }
  else if (!req.body.data.sql) { err404('data.sql missing') }
  else if (!req.body.data.maxzoom || req.body.data.maxzoom < 0 || req.body.data.maxzoom > 22) { err404('data.maxzoom value must between 1 and 22') }
  else {
    var params = {
      username: req.body.data.username,
      template: req.body.data.template,
      sql: req.body.data.sql,
      minzoom: req.body.data.minzoom ? req.body.data.minzoom : 0,
      maxzoom: req.body.data.maxzoom
    };
    console.log( 'creating job...');
    job = queue.create('geojson', params).save(function(err){
      if(err) console.error(err.message);
      else {
        res.status(200).setHeader('Content-Type', 'application/json');
        res.json({'id': job.id, 'created_at': new Date(parseInt(job.created_at))});
      }
    });
    queue.process('geojson', function(job, cb){
      console.log('processing job: #%d', job.id);
      getMbtilesBySQL(job.id, job.data.username, job.data.template, job.data.sql, job.data.minzoom, job.data.maxzoom, cb);
    });
  }
});

service.get('/api/v1/package_exports/:username/:job/', function(req, res){
  var err404 = function(err) {
    console.error('%s USER:%s, JOB:%s, ERROR:%s', hlprs.currdatetime(), req.params['username'], req.params['job'], err);
    res.status(404).setHeader('Content-Type', 'application/json');
    res.json({'params': [{'username': req.params['username'], 'job': req.params['job']}], 'errors': [{'message': err.toString()}]});
  }
  kue.Job.get(req.params['job'], function(err, job){
    if (err) err404(err);
    else if (job.data.username !== req.params['username']) err404('Not accessible');
    else {
      var params = {
        id: job.id,
        username: job.data.username,
        template: job.data.template,
        minzoom: job.data.minzoom,
        maxzoom: job.data.maxzoom,
        bounds: job.data.bounds,
        state: job._state,
        created_at: new Date(parseInt(job.created_at)),
        updated_at: new Date(parseInt(job.updated_at)),
        started_at: new Date(parseInt(job.started_at)),
      }
      if (job._state == 'complete') {
        params.download_url = conf.download_url.replace('{username}', job.data.username).replace('{id}', job.id);
        params.duration = hlprs.msToTime(job.duration);
      }
      if (job._state == 'failed') {
        params.error = job._error;
        params.failed_at = new Date(parseInt(job.failed_at))
      }
      res.status(200).setHeader('Content-Type', 'application/json');
      res.json(params);
    }
  });
});

service.get('/api/v1/package/get/:username/:job/', function(req, res){
  var err404 = function(err) {
    console.error('%s USER:%s, JOB:%s, ERROR:%s', hlprs.currdatetime(), req.params['username'], req.params['job'], err);
    res.status(404).setHeader('Content-Type', 'application/json');
    res.json({'params': [{'username': req.params['username'], 'job': req.params['job']}], 'errors': [{'message': err.toString()}]});
  }
  kue.Job.get(req.params['job'], function(err, job){
    if (err) err404(err);
    else if (job.data.username !== req.params['username']) err404('Not accessible');

    if (job._state == 'complete') {
      var filename = conf.output + '/' + req.params['username'] + '_' + req.params['job'];
      if (fs.existsSync(filename + '.zip')) {
        console.log('downloaded - ' + filename + '.zip');
        res.download(filename + '.zip');
      }
      else err404('No file - ' + filename);
    }
    else {
      err404('Couldnt get package, job status: ' + job._state);
    }
  });
});

console.log('Listening server at port ' + conf.server_port.toString());
service.listen(conf.server_port);
