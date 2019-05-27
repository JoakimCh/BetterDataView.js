
import {BetterDataView} from '../source/BetterDataView.js'
import {jpp} from '../source/misc.js'

async function sha256(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => ('00'+b.toString(16)).slice(-2)).join('')
  return hashHex
}

let objTemplate = { // can be converted to JSON
  value1: 'u8', // unsigned 8-bit integer
  value2: 'i8', // signed 8-bit integer
  value3: 'i32', // signed 32-bit integer
  value4: 'f64', // floating-point number with "double-precision"
  date1: 'date',     // javascript date with millsecond precision stored as 64bit float
  date2: 'unixtime', // javascript date stored as 32bit unix time
  string1: 's', // zero-terminated UTF-8 string
  string2: 's:5', // UTF-8 string with 5 characters (of variable byte length)
  subobject1: { // subobject
    value1: 'u16', // unsigned 16-bit integer
    value2: 'i16', // signed 16-bit integer
  },
  array1: 's:2, this.value1, this.value2', /* 2D array of 2-char strings with
  x and y dimension defined by numbers stored in value1 and value2 */
  array2: ['2', { // array of subobjects (2 elements defined)
    value1: 'u8',
    string1: 's:this.value1', // string with character count defined in same subobject
  }],
  array3: 'u8,4',
}

let obj = {
  value1: 2,
  value2: 2,
  value3: 2147483647,
  value4: 9007199254740991, // javascript's "max safe integer" since it's stored internally as a 64-bit float
  date1: new Date(),
  date2: new Date(),
  string1: "Hello World I ♥ Unicode 😃",
  string2: "Hell😃",//"Hell😃",
  subobject1: { 
    value1: 65535,
    value2: -32767,
  },
  array1: [['12','34'],['56','78']],
  array2: [
    {
      value1: 16,
      string1: 'Hello ♥ world! ♥',//'',
    }, {
      value1: 11,
      string1: 'I ♥ Unicode',//'',
    }
  ],
  array3: Uint8Array.from([11,22,33,44])
}

let buffer = new ArrayBuffer(1024)
let b = new BetterDataView(buffer)

async function main() {
  b.writeObject(objTemplate, obj)
  //let hash = await sha256(buffer)//.then(hash => console.log(hash))
  //console.log(await sha256(buffer))
  b.start()
  jpp(b.readObject(objTemplate))
  //console.log(await sha256(buffer))
}

main()
