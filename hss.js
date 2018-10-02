#!/usr/bin/env node
const hss = require('./index.js');

try {
  hss.cli();
} catch (e) {
  console.log(e);
}
