/*global suite:false test:false */
'use strict';

var Stream = require('stream');
var chai = require('chai-stack');
var passStream = require('..'); // require('pass-stream');

var t = chai.assert;

suite('filters');

test('all data types make it through with transform fns', function (done) {
  // write through filters
  function writeFn(data) {
    /*jshint validthis:true */
    this.queueWrite(data);
  }
  function endFn() {  //
    /*jshint validthis:true */
    this.queueEnd();
  }
  var accum = [];
  var rstream = new Stream();
  var buff1 = new Buffer('one');
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
      t.deepEqual(accum, [1, true, false, 'abc', null, undefined, [10, 20], { a: 'b'}, buff1]);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 1);
    rstream.emit('data', true);
    rstream.emit('data', false);
    rstream.emit('data', 'abc');
    rstream.emit('data', null);
    rstream.emit('data', undefined);
    rstream.emit('data', [10, 20]);
    rstream.emit('data', { a: 'b' });
    rstream.emit('data', new Buffer('one'));
    rstream.emit('end');
  });
});

test('can pass data to end', function (done) {
  // write through filters
  function writeFn(data) {
    /*jshint validthis:true */
    this.queueWrite(data);
  }
  function endFn() {  //
    /*jshint validthis:true */
    this.queueEnd();
  }
  var accum = [];
  var stream = passStream(writeFn, endFn);
  stream
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
      t.deepEqual(accum, [1, null, 3, 4]);
      done();
    });
  process.nextTick(function () {
    stream.write(1);
    stream.write(null);
    stream.write(3);
    stream.end(4);
  });
});

test('inline transformation', function (done) {
  function transFn(data) {
    /*jshint validthis:true */
    this.queueWrite(data * 10);
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(transFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
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

test('odd filter', function (done) {
  function transFn(data) {
    /*jshint validthis:true */
    if (data % 2) this.queueWrite(data);
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(transFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
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
    this.queueWrite(sum);
    this.queueEnd();
  }
  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
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

test('uppercase and count length', function (done) {
  var length = 0;
  function writeFn(data) { // we are assuming data is strings
    /*jshint validthis:true */
    this.queueWrite(data.toUpperCase());
    length += data.length;
  }
  function endFn() {
    /*jshint validthis:true */
    this.emit('length', length);
    this.queueEnd();
  }
  var accum = [];
  var lengthResult = 0;
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('length', function (len) { lengthResult = len; })
    .on('end', function () {
      t.deepEqual(accum, ['ABC', 'DEF', 'GHI']);
      t.equal(lengthResult, 9);
      done();
    });
  process.nextTick(function () {
    rstream.emit('data', 'abc');
    rstream.emit('data', 'def');
    rstream.emit('data', 'ghi');
    rstream.emit('end');
  });
});

test('count chunks', function (done) {
  var chunks = 0;
  function writeFn(data) {
    /*jshint validthis:true */
    chunks++; // counting chunks
    this.queueWrite(data); // passing through
  }
  function endFn() {
    /*jshint validthis:true */
    this.emit('chunk-count', chunks);
    this.queueEnd();
  }
  var accum = [];
  var chunkCount;
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('chunk-count', function (count) { chunkCount = count; })
    .on('end', function () {
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
      self.queueWrite(data); // passing through
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
      this.queueEnd();
    }
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
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