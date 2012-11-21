/*global suite:false test:false */
'use strict';

var Stream = require('stream');
var chai = require('chai-stack');
var passStream = require('..'); // require('pass-stream');

var t = chai.assert;

suite('filters');

test('odd filter', function (done) {
  function transFn(data) {
    /*jshint validthis:true */
    if (data % 2) this.write(data);
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(transFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function (end) {
      t.deepEqual(accum, [1, 3]);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', 2);
    rstream.emit('data', 3);
    rstream.emit('end');
  });
});

test('sum filter', function (done) {
  var sum = 0;
  function writeFn(data) {
    sum += data; // summing data but not passing through
  }
  function endFn() {
    /*jshint validthis:true */
    this.write(sum);
    this.end();
  }
  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function (end) {
      t.deepEqual(accum, [6]);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', 2);
    rstream.emit('data', 3);
    rstream.emit('end');
  });
});

test('count chunks', function (done) {
  var chunks = 0;
  function writeFn(data) {
    /*jshint validthis:true */
    chunks++; // counting chunks
    this.write(data); // passing through
  }
  function endFn() {
    /*jshint validthis:true */
    this.emit('chunk-count', chunks);
    this.end();
  }
  var accum = [];
  var chunkCount;
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('chunk-count', function (count) { chunkCount = count; })
    .on('end', function (end) {
      t.deepEqual(accum, [1, 2, 3]);
      t.equal(chunkCount, 3);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', 2);
    rstream.emit('data', 3);
    rstream.emit('end');
  });
});

test('delay packets', function (done) {
  var ended = false;
  var pendingWrites = 0;
  function writeFn(data) {
    /*jshint validthis:true */
    pendingWrites++;
    var self = this;
    setTimeout(function () {
      self.write(data); // passing through
      pendingWrites--;
      if (ended) onEnd.call(self);
    }, 10);
  }
  function endFn() {
    /*jshint validthis:true */
    ended = true;
    onEnd.call(this);
  }
  function onEnd() {
    /*jshint validthis:true */
    if (!pendingWrites) {
      this.end();
    }
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
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