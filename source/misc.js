
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
 
function replaceAll(str, term, replacement) {
  return str.replace(new RegExp(escapeRegExp(term), 'g'), replacement)
}

const jpp = function(obj) {
  console.log(JSON.stringify(obj,null,2))
}

const assert = function (condition, message) {
  if (!condition) {
    message = message || "Assertion failed"
    //message = "\x1b[33m"+message+"\x1b[0m"
    throw new Error(message)
  }
}

export {replaceAll, jpp, assert}
