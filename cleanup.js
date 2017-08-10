var fs = require('fs'); 
var kue = require('kue'),
  jobs = kue.createQueue();
var async = require('async');  
var conf = require('./config.js');
var hlprs = require('./helpers.js');
var now = new Date().getTime();

CLEANUP_MAX_FAILED_TIME = 30 * 24 * 60 * 60 * 1000;  // 30 days
CLEANUP_MAX_ACTIVE_TIME = 1 * 24 * 60 * 60 * 1000;  // 1 day
CLEANUP_MAX_COMPLETE_TIME = 2 * 24 * 60 * 60 * 1000; // 2 days
//CLEANUP_MAX_COMPLETE_TIME = 50 * 60 * 1000; // 50 minutes
MAX_JOBS = 100

async.parallel([
  function(callback) {
    kue.Job.rangeByState('complete', 0, MAX_JOBS, 'asc', function(err, jobs) {
      if (err) return callback(err);
      else {
        var counter = jobs.length;
        if (counter == 0)
          return callback();
          
        jobs.forEach(function(job) {
          var valid = (parseInt(job.created_at) + CLEANUP_MAX_COMPLETE_TIME);
          if (now > valid) {
            job.remove();  
            var zipFile = conf.output + '/' + job.data.username + '_' + job.id + '.zip';
            if (hlprs.fileExists(zipFile)) {
              fs.unlink(zipFile, function(err){
                if (err) return callback(err);
                else console.log('removed file %s', zipFile);
              });
            }
            console.log('removed completed job %s', job.id);
          }
          else 
            console.log('valid complete %s < %s job - %s', now, valid, job.id);
          
          counter -=1;      
          if (counter == 0) {
            return callback();
          }
            
        });
      }
    });
  },
  function(callback) {
    kue.Job.rangeByState('failed', 0, MAX_JOBS, 'asc', function(err, jobs) {
      if (err) return callback(err);
      else {
        var counter = jobs.length;
        if (counter == 0)
          return callback();
          
        jobs.forEach(function(job) {
          var valid = (parseInt(job.created_at) + CLEANUP_MAX_COMPLETE_TIME);
          if (now > valid) {
            job.remove();  
            console.log('removed failed job %s', job.id);
          }
          else
            console.log('valid failed %s < %s job - %s', now, valid, job.id);
            
          counter -=1;
          if (counter == 0) {
            return callback();
          }
            
        });
      }
    });
  },
  function(callback) {
    kue.Job.rangeByState('active', 0, MAX_JOBS, 'asc', function(err, jobs) {
      if (err) return callback(err);
      else {
        var counter = jobs.length;
        if (counter == 0)
          return callback();
          
        jobs.forEach(function(job) {
          var valid = (parseInt(job.created_at) + CLEANUP_MAX_COMPLETE_TIME);
          if (now > valid) {
            job.remove();  
            console.log('removed active job %s', job.id);
          }
          else
            console.log('valid active %s < %s job - %s', now, valid, job.id);
            
          counter -=1;
          if (counter == 0) {
            return callback();
          }     
        });
      }
    });
  }
], 
function(err) {
  if (err) throw err;
  else console.log('Done..');
  process.exit(0);
});


