'use strict';

var pauseStream = require('pause-stream');
var Stream = require('stream');

function passStream(writeFn, endFn) {
  var origPauseStream = pauseStream(); // create instance of pause stream
  var stream = new Stream();
  Object.keys(origPauseStream).forEach(function (x) { // mixin fns, getter/setter for vars
    if (typeof origPauseStream[x] === 'function') stream[x] = origPauseStream[x];
    else {
      Object.defineProperty(stream, x, {
        get: function () { return origPauseStream[x]; },
        set: function (v) { origPauseStream[x] = v; },
        enumerable: true
      });
    }
  });
  if (writeFn) {
    stream.write = function write(data, encoding) {
      writeFn.apply(origPauseStream, arguments);
      return !(origPauseStream.paused); // write completed if not paused
    };
  }

  if (endFn) {
    stream.end = function end(data, encoding) {
      if (data) writeFn.apply(origPauseStream, arguments);
      endFn.apply(origPauseStream);
    };
  }

  return stream;
}

module.exports = passStream;