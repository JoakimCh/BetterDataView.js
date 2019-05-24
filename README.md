
# BetterDataView ES6 module

This is a standard ECMAScript module which will work with the
newest browsers (tested with Chrome and Firefox) and Node.js*.

This module contains a class named BetterDataView which is an extension of the
standard DataView class. Its purpose is to be more comfortable to use as well as
supporting much more advanced features for interacting with ArrayBuffers.

One big feature is the ability to read/write Javascript objects into ArrayBuffers.

## *To use it with Node.js
_Todo_

## To use it in supported browsers
`import {BetterDataView} from './BetterDataView/BetterDataView.js'`

## How to use
_Todo_

## Object to/from ArrayBuffer
### Motivation
Previously one would use technologies like JSON or MessagePack to send Javascript
objects "over the wire" (for example using WebSockets). But this has a rather large
overhead (in byte size) compared to the method used by BetterDataView.

BetterDataView aims to mimic low level binary protocols where the developers have
complete control over the exact bit size used to store data fields. Similar to
structures in C++.

### How it works
To read or write an object to/from an ArrayBuffer BetterDataView needs to know exactly 
how this object will be stored in its binary form. This is made possible using what I 
chose to call "object templates".

An object template is a Javascript object defining how objects using this template is
stored. Hence both the server and the client needs to use the same template when 
sending objects between them.

In other words; the data-structure is NOT stored together with the data (like it would 
be if using JSON or MessagePack). But you could optionally send the template across 
the wire though.

If object templates are implemented in other programming languages which doesn't 
support objects like the ones in Javascript; one could choose to implement them using
the JSON format since an object template is convertable to/from JSON.

### Example object template
Here is an example along with an object which could be stored using it.
```javascript
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
  }]
}

let obj = {
  value1: 2,
  value2: 2,
  value3: 2147483647
  value4: 9007199254740991 // javascript's "max safe integer" since it's stored internally as a 64-bit float
  date1: new Date()
  date2: new Date()
  string1: "I ♥ Unicode 😃"
  string2: "Hell☺"
  subobject1: { 
    value1: 65535
    value2: -32767
  },
  array1: [['12','34'],['56','78']],
  array2: [
    {
      value1: 17,
      string1: 'Hello world! 😃',
    }, {
      value1: 13,
      string1: 'I ♥ Unicode',
    }
  ]
}
```
