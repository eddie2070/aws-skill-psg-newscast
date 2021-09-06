# twitter-screen-name [![Build Status](https://travis-ci.org/tableflip/twitter-screen-name.svg?branch=master)](https://travis-ci.org/tableflip/twitter-screen-name) [![Dependency Status](https://david-dm.org/tableflip/twitter-screen-name.svg)](https://david-dm.org/tableflip/twitter-screen-name)
Extract a twitter screen name from a twitter URL or `@username` string. Return `null` if not valid.

## Example

```js
var twitterScreenName = require('twitter-screen-name')

twitterScreenName('http://twitter.com/_alanshaw') // -> _alanshaw
twitterScreenName('https://www.twitter.com/_alanshaw') // -> _alanshaw
twitterScreenName('http://twitter.com/_alanshaw/status/695527644901801984') // -> _alanshaw
twitterScreenName('@_alanshaw') // -> _alanshaw
twitterScreenName('_alanshaw') // -> _alanshaw
// etc.

twitterScreenName('http://example.org/foo/') // -> null
twitterScreenName('toolongfortwitter') // -> null
// etc.
```
