# better-data-view

This is a standard ECMAScript module containing a class named BetterDataView which is an extension of the standard DataView class. Its purpose is to be more comfortable to use as well as supporting much more advanced features for interacting with ArrayBuffers.

## Features

* The ability to read/write JavaScript objects into ArrayBuffers (using our object template syntax).
* Reading and writing of strings, arrays and date.
* Allowing the offset to grow instead of having to be set every time.
* Seek and rseek functions for changing offset.
* Allows the endianness to be defined just once.
* Extended with smaller aliases like u8() to read and u8(value) to write.
* dataUntilPos() returns a new DataView of the data until the current position.

## Install (from github) using NPM
```bash
npm install joakimch/better-data-view
```

## Example code
```javascript
import {BetterDataView} from 'better-data-view'
const jpp = function(obj) {console.log(JSON.stringify(obj,null,2))}

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
```

## How to use
Check the readme in the [example directory](https://github.com/JoakimCh/better-data-view/tree/master/examples)!

## Object to/from ArrayBuffer

### Motivation
Previously one would use technologies like JSON or MessagePack to send JavaScript
objects "over the wire" (for example using WebSockets). But this has a rather large
overhead (in byte size) compared to the method used by BetterDataView.

BetterDataView aims to mimic low level binary protocols where the developers have
complete control over the exact bit size used to store data fields. Similar to
structures in C++.

### How it works
To read or write an object to/from an ArrayBuffer BetterDataView needs to know exactly 
how this object will be stored in its binary form. This is made possible using what I 
chose to call "object templates".

An object template is a JavaScript object defining how objects using this template is
stored. Hence both the server and the client needs to use the same template when 
sending objects between them.

In other words; the data-structure is NOT stored together with the data (like it would 
be if using JSON or MessagePack). But you could optionally send the template across 
the wire though.

_Note: If object templates are implemented in other programming languages which doesn't 
support objects like the ones in JavaScript; one could choose to implement them using
the JSON format since an object template is convertable to/from JSON._

## WARNING (please read)

### This is a one-man project put here mostly to serve myself, not the public. Hence there might be bugs, missing or incomplete features. And I might not care about "industry standards", your meanings or doing things in any other way than MY way.

### But I do believe that this project can be useful to others, so rest assured that I will not remove it. Feel free to use it and spread the word about it, but never expect anything from me!

If you want to contribute to the project you might be better off by forking it, I don't have much time or energy to manage an open source project. If you fixed a bug I will probably accept the pull request though.