/*global suite:false test:false */
'use strict';

var Stream = require('stream');
var chai = require('chai-stack');
var passStream = require('..'); // require('pass-stream');

var t = chai.assert;

suite('basic');

test('simple use', function (done) {
  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream())
    .on('data', function (data) { accum.push(data); })
    .on('end', function (end) {
      t.deepEqual(accum, [1, 2, 3]);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', 2);
    rstream.emit('data', 3);
    rstream.emit('end');
  });
});

test('paused', function (done) {
  var accum = [];
  var rstream = new Stream();
  var s = rstream
    .pipe(passStream())
    .on('data', function (data) { accum.push(data); })
    .on('end', function (end) {
      t.deepEqual(accum, [1, 2, 3]);
      done();
    });
  s.pause();
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', 2);
    rstream.emit('data', 3);
    rstream.emit('end');
    s.resume();
  });
});

test('inline transformation', function (done) {
  function transFn(data) {
    /*jshint validthis:true */
    this.write(data * 10);
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(transFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function (end) {
      t.deepEqual(accum, [10, 20, 30]);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', 2);
    rstream.emit('data', 3);
    rstream.emit('end');
  });
});

