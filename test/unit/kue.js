'use strict';

var conf = require('../../config.js');
var assert = require('assert');

var client = require('redis').createClient(conf.kue_redis_port, conf.kue_redis_host);
var queue = require('kue').createQueue();

describe('Redis connections test', function(cb) { 
  it('should read/write redis', function(cb) {      
    
    client.on('error', function (err) {
      assert(err instanceof Error);
      assert(err instanceof redis.AbortError);
      assert(err instanceof redis.AggregateError);
      assert.strictEqual(err.errors.length, 2); // The set and get got aggregated in here
      assert.strictEqual(err.code, 'NR_CLOSED');
      return cb(err)
    });
    
    client.set('test__foo', 123, function (err, reply) {
      if (err) return cb(err); 
      else {
        assert.equal(reply, 'OK');
        client.get('test__foo', function (err, reply) {
          if (err) return cb(err); 
          else {
            assert.equal(reply, 123);
            client.del('test__foo', function (err, reply) {
              if (err) return cb(err); 
              else {
                assert.equal(reply, 1);
                return cb();
              }
            });
          }
        });
      }
    });
  });
});

describe('Kue jobmanager test', function(cb) {
  before(function() {
    queue.testMode.enter();
  });
  
  afterEach(function() {
    queue.testMode.clear();
  });
  
  after(function() {
    queue.testMode.exit()
  });
  
  it('will create jobs to kue', function() {
    queue.createJob('myJob', { foo: 'bar' }).save();
    queue.createJob('anotherJob', { baz: 'bip' }).save();
    assert.equal(queue.testMode.jobs.length, 2);
    assert.equal(queue.testMode.jobs[0].type, 'myJob');
    assert.deepEqual(queue.testMode.jobs[0].data, { foo: 'bar' });      
  });
});


