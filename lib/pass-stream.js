'use strict';

var pauseStream = require('pause-stream');

function passStream(writeFn, endFn) {
  var stream = pauseStream(); // create instance of pause stream

  // if writeFn or endFn are provided then rename original to queueWrite, queueEnd

  if (writeFn) {
    stream.queueWrite = stream.write; // alias
    stream.write = function write(data, encoding) {
      writeFn.apply(stream, arguments);
      return !(stream.paused); // write completed if not paused
    };
  }

  if (endFn) {
    stream.queueEnd = stream.end; // alias
    stream.end = function end(data, encoding) {
      if (arguments.length) stream.write.apply(stream, arguments); // write any data through
      endFn.apply(stream); // call end without any args
    };
  }

  return stream;
}

module.exports = passStream;