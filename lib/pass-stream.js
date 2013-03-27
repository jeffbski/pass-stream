'use strict';

var Stream = require('stream');
var util = require('util');

// node 0.10+ has PassThrough stream so use it if available
// otherwise use readable-stream module
var PassThrough = (Stream.PassThrough) ?
  Stream.PassThrough :
  require('readable-stream').PassThrough;


function PassThroughExt(writeFn, endFn, options) {
  if (!(this instanceof PassThroughExt)) {
    return new PassThroughExt(writeFn, endFn, options);
  }
  PassThrough.call(this, options);
  this._writeFn = writeFn;
  this._endFn = endFn;
}

util.inherits(PassThroughExt, PassThrough);

PassThroughExt.prototype._transform = function _transform(chunk, encoding, cb) {
  if (this._writeFn) return this._writeFn.apply(this, arguments);
  return PassThrough.prototype._transform.apply(this, arguments);
};

PassThroughExt.prototype._flush = function _flush(cb) {
  console.log('in _flush', cb); // TODO remove
  if (this._endFn) return this._endFn.apply(this, arguments);
  return cb();
};

function passStream(writeFn, endFn, options) {
  var stream = new PassThroughExt(writeFn, endFn, options);
  return stream;
}

module.exports = passStream;