/*global suite:false test:false */
'use strict';

var Stream = require('stream');
var chai = require('chai-stack');
var passStream = require('..'); // require('pass-stream');

var t = chai.assert;

suite('filters');

test('all data types make it through with transform fns', function (done) {
  // write through filters
  function writeFn(data, encoding, cb) {
    /*jshint validthis:true */
    console.log('in writeFn', data, encoding, cb);
    this.push(data);
    cb();
  }
  function endFn(cb) {  //
    /*jshint validthis:true */
    console.log('in endfn for all data types'); // TODO remove
    cb();
  }
  var accum = [];
  var rstream = new Stream();
  var buff1 = new Buffer('one');
  rstream
    .pipe(passStream(writeFn, endFn, { objectMode: true }))
    .on('data', function (data) {
    console.log('data', data);  // why is it failing to send false through?
    accum.push(data); })
    .on('end', function () {
      t.strictEqual(accum[0], 1);
      t.strictEqual(accum[1], true);
      t.strictEqual(accum[2], false);
      t.strictEqual(accum[3], 'abc');
      t.strictEqual(accum[4], null);
      t.strictEqual(accum[5], undefined);
      t.deepEqual(accum[6], [10, 20]);
      t.deepEqual(accum[7], { a: 'b' });
      t.deepEqual(accum[8], buff1);
      t.strictEqual(accum.length, 9);
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
  function writeFn(data, encoding, cb) {
    /*jshint validthis:true */
    this.push(data);
    cb();
  }
  function endFn(cb) {  //
    /*jshint validthis:true */
    cb();
  }
  var accum = [];
  var stream = passStream(writeFn, endFn, { objectMode: true });
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
  function transFn(data, encoding, cb) {
    /*jshint validthis:true */
    this.push(data * 10);
    cb();
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(transFn, null, { objectMode: true }))
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
  function transFn(data, encoding, cb) {
    /*jshint validthis:true */
    if (data % 2) this.push(data);
    cb();
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(transFn, null, { objectMode: true }))
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
  function writeFn(data, encoding, cb) {
    sum += data; // summing data but not passing through
  }
  function endFn(cb) {
    /*jshint validthis:true */
    this.push(sum);
    cb();
  }
  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn, { objectMode: true }))
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
  function writeFn(data, encoding, cb) { // we are assuming data is strings
    /*jshint validthis:true */
    this.push(data.toUpperCase());
    length += data.length;
  }
  function endFn(cb) {
    /*jshint validthis:true */
    this.emit('length', length);
    cb();
  }
  var accum = [];
  var lengthResult = 0;
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn, { objectMode: true }))
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
  function writeFn(data, encoding, cb) {
    /*jshint validthis:true */
    chunks++; // counting chunks
    this.push(data); // passing through
    cb();
  }
  function endFn(cb) {
    /*jshint validthis:true */
    this.emit('chunk-count', chunks);
    cb();
  }
  var accum = [];
  var chunkCount;
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn, { objectMode: true }))
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
  function writeFn(data, encoding, cb) {
    /*jshint validthis:true */
    var self = this;
    setTimeout(function () {
      self.push(data); // passing through
      cb();
    }, 10);
  }

  var accum = [];
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, null, { objectMode: true }))
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