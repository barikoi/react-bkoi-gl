// The react-bkoi-gl bundle carries the (es2020-lowered) maplibre engine, and
// importing it evaluates engine module scope — which needs TextDecoder, one of
// the few Web APIs jsdom does not provide. CRA wires this file up before every
// test file automatically.
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder
}
