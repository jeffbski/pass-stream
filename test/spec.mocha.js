/*global suite:false test:false */
'use strict';

var spec = require('stream-spec');
var tester = require('stream-tester');
var passStream = require('..'); // require('pass-stream');

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
