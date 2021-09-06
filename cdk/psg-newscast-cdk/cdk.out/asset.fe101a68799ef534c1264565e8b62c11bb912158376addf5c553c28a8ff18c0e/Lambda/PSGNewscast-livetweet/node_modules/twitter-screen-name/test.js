var test = require('tape')
var twitterScreenName = require('./')

test('Should extract screen name from screen name', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('_alanshaw'), '_alanshaw')
  t.end()
})

test('Should extract screen name from screen name with @', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('@_alanshaw'), '_alanshaw')
  t.end()
})

test('Should extract screen name from url', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('http://twitter.com/_alanshaw'), '_alanshaw')
  t.end()
})

test('Should extract screen name from url with https', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('https://twitter.com/_alanshaw'), '_alanshaw')
  t.end()
})

test('Should extract screen name from url with www.', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('http://www.twitter.com/_alanshaw'), '_alanshaw')
  t.end()
})

test('Should extract screen name from url with trailing slash', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('http://twitter.com/_alanshaw/'), '_alanshaw')
  t.end()
})

test('Should extract screen name from url with trailing junk', function (t) {
  t.plan(1)
  t.equal(twitterScreenName('http://twitter.com/_alanshaw/status/695527644901801984'), '_alanshaw')
  t.end()
})

test('Should not extract screen name from non twiiter url', function (t) {
  t.plan(1)
  t.notOk(twitterScreenName('http://example.org/_alanshaw'))
  t.end()
})

test('Should not extract screen name from invalid screen name', function (t) {
  t.plan(1)
  t.notOk(twitterScreenName('toolongfortwitter'))
  t.end()
})
