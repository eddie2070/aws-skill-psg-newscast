module.exports = function (str) {
  if (!str) return null
  str = str + ''

  var screenNameRegex = /^@?(\w){1,15}$/

  if (screenNameRegex.test(str)) {
    return str[0] === '@' ? str.slice(1) : str
  }

  var urlRegex = /^https?:\/\/(www\.)?twitter\.com\/(\w{1,15})(\/.*)?$/i
  var matches = urlRegex.exec(str)

  return matches ? matches[2] : null
}
