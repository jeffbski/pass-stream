/*global suite:false test:false */
'use strict';

var spec = require('stream-spec');
var tester = require('stream-tester');
var passStream = require('..'); // require('pass-stream');
var Stream = require('stream');
var chai = require('chai-stack');

var t = chai.assert;

suite('stream-spec');

test('spec random stream', function (done) {
  var ps = passStream();
  spec(ps)
    .through({strict: false})
    .validateOnExit();

  var master = tester.createConsistentStream();

  tester.createRandomStream(1000) //1k random numbers
    .pipe(master)
    .pipe(tester.createUnpauseStream())
    .pipe(ps)
    .pipe(tester.createPauseStream())
    .pipe(master.createSlave())
    .on('error', function (err) { done(err); })
    .on('end', function () { done(); });
});

test('spec random stream with transform fns', function (done) {
  function writeFn(data) {
    /*jshint validthis:true */
    this.queueWrite(data);
  }
  function endFn() {
    /*jshint validthis:true */
    this.queueEnd();
  }
  var ps = passStream(writeFn, endFn);
  spec(ps)
    .through({strict: false})
    .validateOnExit();

  var master = tester.createConsistentStream();

  tester.createRandomStream(1000) //1k random numbers
    .pipe(master)
    .pipe(tester.createUnpauseStream())
    .pipe(ps)
    .pipe(tester.createPauseStream())
    .pipe(master.createSlave())
    .on('error', function (err) { done(err); })
    .on('end', function () { done(); });
});

// erroring source stream

test('on source error, stream should emit error', function (done) {
  var ps = passStream();
  spec(ps)
    .through({
      strict: false,
      error: true
    })
    .validateOnExit();

  var source = new Stream();
  source
    .pipe(ps)
    .on('error', function (err) {
      t.equal(err.message, 'my error');
      done();
    });

  process.nextTick(function () {
    source.emit('error', new Error('my error'));
  });
});

test('on source error w/transferFns, stream should emit error', function (done) {
  function writeFn(data) {
    /*jshint validthis:true */
    this.queueWrite(data);
  }
  function endFn() {
    /*jshint validthis:true */
    this.queueEnd();
  }
  var ps = passStream(writeFn, endFn);
  spec(ps)
    .through({
      strict: false,
      error: true
    })
    .validateOnExit();

  var source = new Stream();
  source
    .pipe(ps)
    .on('error', function (err) {
      t.equal(err.message, 'my error');
      done();
    });

  process.nextTick(function () {
    source.emit('error', new Error('my error'));
  });
});

