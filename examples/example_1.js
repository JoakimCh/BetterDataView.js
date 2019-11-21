
import {BetterDataView} from '../source/BetterDataView.js'
import {jpp} from '../source/misc.js'

const objTemplate = { // can be converted to JSON
  value1: 'u8', // unsigned 8-bit integer
  value2: 'i8', // signed 8-bit integer
  value3: 'i32', // signed 32-bit integer
  value4: 'f64', // floating-point number with "double-precision"
  date1: 'date',     // javascript date with millsecond precision stored as 53bit float
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
  type: 's',
  // a detail object with fields depending on a previous value
  detail: ['switch', 'this.type', [ // this is like a switch statement with different cases
    ['human', {
      name: 's',
      gender: 's',
      age: 'u8'
    }],
    ['cabinet', {
      width: 'u8',
      height: 'u8',
      model: 's'
    }],
    ['cars', {
      count: 'u8',
      cars: 's, this.count'
    }]
  ]]
}

const detailFor = 'cabinet'
const obj = {
  value1: 2,
  value2: 2,
  value3: 2147483647,
  value4: 9007199254740991, // javascript's "max safe integer" since it's stored internally as a 53-bit float
  date1: new Date(),
  date2: new Date(),
  string1: "Hello World I ♥ Unicode 😃",
  string2: "Hell😃",
  subobject1: { 
    value1: 65535,
    value2: -32767,
  },
  array1: [['12','34'],['56','78']],
  array2: [
    {
      value1: 16,
      string1: 'Hello ♥ world! ♥',
    }, {
      value1: 11,
      string1: 'I ♥ Unicode',
    }
  ],
  array3: Uint8Array.from([11,22,33,44]),
  type: detailFor,
  detail: (() => {
    switch (detailFor) {
      case 'human':
        return { 
          name: 'Joe',
          gender: 'male',
          age: 86
        }
      case 'cabinet':
        return {
          width: 47,
          height: 22,
          model: 'lixhult'
        }
      case 'cars':
        return {
          count: 5,
          cars: ['audi','bmw','lada','tesla','ford']
        }
    }
  })()
}

const buffer = new ArrayBuffer(1024)
const b = new BetterDataView(buffer)

b.writeObject(objTemplate, obj) // write the object to our buffer
b.start() // set the buffer position back to start
jpp(b.readObject(objTemplate)) // then read the object from the buffer and print it
