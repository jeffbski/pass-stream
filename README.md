# pass-stream - pass-through node.js stream which can filter/adapt and pause data

It is built off of pause-stream so it provides buffering capabilities for pausing

[![Build Status](https://secure.travis-ci.org/jeffbski/pass-stream.png?branch=master)](http://travis-ci.org/jeffbski/pass-stream)

## Installation

```bash
npm install pass-stream
```

## Usage

 - `passStream(writeFn, endFn)` takes an optional writeFn and endFn and returns a pauseable stream which can be piped or used like any other


```javascript
var passStream = require('pass-stream');
var ps = passStream(); // constructing stream without any transformations
readStream
  .pipe(ps)
  .pipe(anotherStream)
```

To add transform/filter functionality you may provide a writeFn and/or endFn which allows you to tap into the write and end processing.

If you provide a writeFn, then it is up to you to call `this.write(data)` with whatever transformed data.

If you provide a endFn, then it is up to you to call `this.end()` when you are ready to end the stream (be sure this is after you are done with all your writes).

The `this` context of the writeFn and endFn is set to that of the pause-stream so you have all the normal stream functions like `write`, `end`, `emit`.

```javascript
var passStream = require('pass-stream');
  var length = 0;
  function writeFn(data) { // we are assuming data is strings
    this.write(data.toUpperCase());  // upper case
    length += data.length;  // keep track of length
  }
  function endFn() {
    this.emit('length', length); // emit length now that it is done
    this.end();
  }
  var lengthResult = 0;
  var rstream = new Stream();
  rstream
    .pipe(passStream(writeFn, endFn))  // construct a passStream with transformFns
    .on('length', function (len) { lengthResult = len; })
    .pipe(anotherStream);
```


## Goals

Simple pass-through stream which can be used to build other useful stream filters

## Why

In looking at similar efforts for through streams, I was unhappy with some of the design choices or implementations.

## Get involved

If you have input or ideas or would like to get involved, you may:

 - contact me via twitter @jeffbski  - <http://twitter.com/jeffbski>
 - open an issue on github to begin a discussion - <https://github.com/jeffbski/pass-stream/issues>
 - fork the repo and send a pull request (ideally with tests) - <https://github.com/jeffbski/pass-stream>

## License

 - [MIT license](http://github.com/jeffbski/pass-stream/raw/master/LICENSE)

