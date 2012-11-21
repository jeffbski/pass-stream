'use strict';

var pauseStream = require('pause-stream');

function passStream() {
  var stream = pauseStream();
  return stream;
}



module.exports = passStream;