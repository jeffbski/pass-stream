# pass-stream - pass through stream which can filter/adapt data

It is built off of pause-stream so it provides buffering capabilities for pausing

[![Build Status](https://secure.travis-ci.org/jeffbski/pass-stream.png?branch=master)](http://travis-ci.org/jeffbski/pass-stream)

## Installation

Requires node.js >= 0.8

```bash
npm install pass-stream
```

## Usage

```javascript
var passStream = require('pass-stream');
var ps = passStream();
readStream
  .pipe(ps)
  .pipe(anotherStream)
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

