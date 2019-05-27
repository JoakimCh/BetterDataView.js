
/*
This class allows the offset to grow instead of having to be set every time,
and adds seek and rseek functions for changing it.
It also allows the endianness to be defined just once.
It's also extended with smaller aliases like:
u8() to read and u8(value) to write

ToDo:
Buffered version of write/read object
  Will create the code for a function which has the needed commands to do it
  This is put in a map with the key being the template object
  Also buffer object size with function for returning it

*/
import {jpp,assert} from "./misc.js"

function assert_date(date) {
  assert(date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date), 
    'This is not a date object with a valid date: '+date
  )
}

class BetterDataView_base extends DataView {
  constructor(buffer, byteOffset, byteLength) { // two last are optional
    super(buffer, byteOffset, byteLength) // todo: bug with some functions and view based on buffer when byteOffset is set
    this._rwPos = 0//this.byteOffset
    this._littleEndian = true
    //this._tempObjUniqueId = 0
    //this._readObjectFunction_cache = new Map()
    //this._writeObjectFunction_cache = new Map()
  }
  setEndianness(littleEndian=true) {
    this._littleEndian = littleEndian
  }
  pos() { // current position within buffer
    return this._rwPos
  }
  seek(byteOffset=0) {
    this._rwPos = byteOffset
  }
  rseek(byteOffset) { // relative seek
    this._rwPos += byteOffset
  }
  start() { // seek to start
    this.seek()
  }
  end() { // seek to end
    this.seek(this.byteLength)
  }
  dataUntilPos() { // returns a new DataView of data until current position
    return new DataView(this.buffer, 0, this._rwPos)
  }
  i8(value) {
    if (arguments.length >= 1) {
      super.setInt8(this._rwPos, value)
    } else {
      value = super.getInt8(this._rwPos)
    }
    this._rwPos+=1
    return value
  }
  u8(value) {
    if (arguments.length >= 1) {
      super.setUint8(this._rwPos, value)
    } else {
      value = super.getUint8(this._rwPos)
    }
    this._rwPos+=1
    return value
  }
  i16(value) {
    if (arguments.length >= 1) {
      super.setInt16(this._rwPos, value, this._littleEndian)
    } else {
      value = super.getInt16(this._rwPos, this._littleEndian)
    }
    this._rwPos+=2
    return value
  }
  u16(value) {
    if (arguments.length >= 1) {
      super.setUint16(this._rwPos, value, this._littleEndian)
    } else {
      value = super.getUint16(this._rwPos, this._littleEndian)
    }
    this._rwPos+=2
    return value
  }
  i32(value) {
    if (arguments.length >= 1) {
      super.setInt32(this._rwPos, value, this._littleEndian)
    } else {
      value = super.getInt32(this._rwPos, this._littleEndian)
    }
    this._rwPos+=4
    return value
  }
  u32(value) {
    if (arguments.length >= 1) {
      super.setUint32(this._rwPos, value, this._littleEndian)
    } else {
      value = super.getUint32(this._rwPos, this._littleEndian)
    }
    this._rwPos+=4
    return value
  }
  f32(value) {
    if (arguments.length >= 1) {
      super.setFloat32(this._rwPos, value, this._littleEndian)
    } else {
      value = super.getIFloat32(this._rwPos, this._littleEndian)
    }
    this._rwPos+=4
    return value
  }
  f64(value) { // actually JS uses a maximum of 53 bits
    if (arguments.length >= 1) {
      super.setFloat64(this._rwPos, value, this._littleEndian)
    } else {
      value = super.getFloat64(this._rwPos, this._littleEndian)
    }
    this._rwPos+=8
    return value
  }
  /* bigint?
  i64() {
    
  }
  u64() {
    
  }
  */
  s() { // read/write string shorthand
    switch (arguments.length) {
      case 0:
        return this.readString()
      case 1:
        if (typeof arguments[0] == 'number') {
          return this.readString(arguments[0])
        } else {
          this.writeString(arguments[0])
        }
      break
      case 2:
        this.writeString(arguments[0], arguments[1])
      break
    }
  }
  readString(length=0) {
    /*
    I actually helped finding a bug in Chrome with this function:
    https://bugs.chromium.org/p/chromium/issues/detail?id=910292
    */
    let textDecoder = new TextDecoder('utf-8', {fatal: true})
    let text = ''
    if (length) { // if defined use it
      let startOffset = this._rwPos
      let bytesToRead = length // let's start with this size
      let successiveErrors = 0
      // read until we got all UTF-8 chars
      while ([...text].length < length && successiveErrors < 4) {
        try {
          //log(`Bytes to read: ${bytesToRead}`)
          if (bytesToRead <= this.buffer.byteLength) {
            let dataView = new DataView(this.buffer, startOffset, bytesToRead)
            text = textDecoder.decode(dataView)
            //log(`Got: '${text}' = ${[...text].length} characters`)
            successiveErrors = 0
          } else {
            throw new Error('Error decoding the UTF-8 string; end of buffer reached')
          }
        } catch (e) {
          successiveErrors ++
          if (e.name != 'TypeError') {
            throw e
          }
        }
        bytesToRead ++
      }
      if (successiveErrors) {
        throw new Error('Errors decoding the UTF-8 string')
      }
      this._rwPos += bytesToRead-1
    } else { // detect it (zero terminated strings)
      let startOffset = this._rwPos//+1
      while (this.u8() != 0) {
        if (this._rwPos == this.byteLength) {
          break
        }
      }
      length = (this._rwPos-startOffset)-1
      let dataView = new DataView(this.buffer, startOffset, length)
      text = textDecoder.decode(dataView)
    }
    return text//textDecoder.decode(dataView)
  }
  writeString(string, zeroTerminated=true) {
    let textEncoder = new TextEncoder()
    let bytes = textEncoder.encode(string) // returns Uint8Array
    //console.log(bytes)
    for (let i=0; i<bytes.length; i++) {
      this.u8(bytes[i])
    }
    if (zeroTerminated) {
      this.u8(0)
    }
  }
  writeTypedArray(typedArray) {
    if (('byteLength' in typedArray)==false) {
      throw Error('Argument is not a TypedArray')
    }
    // we don't know which type it is, so let's create a uint8 view of it
    let byteArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)
    for (let byte of byteArray) {
      this.u8(byte)
    }
  }
  readTypedArray(byteLength) { // reads it into an ArrayBuffer, which you then use to create a TypedArray of correct type
    let buffer = new ArrayBuffer(byteLength)
    let dataView = new BetterDataView_base(buffer)
    for (let i=0; i<byteLength; i++) {
      dataView.u8(this.u8())
    }
    return buffer
  }
  
  writeTime(date, includeMilliseconds=false) { // writes date as UTC
    assert_date(date)
    if (includeMilliseconds) {
      this.f64(date.getTime())
    } else {
      this.u32(Math.round(date.getTime()/1000.0))
    }
  }
  readTime(includeMilliseconds=false) {
    let dateMilliseconds = 0.0
    if (includeMilliseconds) {
      dateMilliseconds = this.f64()
    } else {
      dateMilliseconds = this.u32()*1000.0
    }
    return new Date(dateMilliseconds)
  }
  /**/
  readArray(type, ...dim) {
    let array
    if (dim.length) { // if we should create an empty array
      array = new Array(dim[0])
      for (let i=0; i<dim[0]; i++) {
        array[i] = this.readArray(type, ...dim.slice(1))
      }
    } else { // if we should read a value into the array
      if (type.startsWith('s') && type.indexOf('#') != -1) { // if a string with size
        //console.log(type.split('#')[1])
        array = this.readString(+type.split('#')[1])
      } else {
        array = this[type]()
      }
    }
    return array
  }
  writeArray(type, array) {
    if (Array.isArray(array)) {
      for (let value of array) { //for (let i=0; i<array.length; i++) {
        this.writeArray(type, value)
      }
    } else {
      if (type.startsWith('s') && type.indexOf('#') != -1) { // if a string with size
        //console.log(array, type.split('#')[1])
        this.writeString(array, false) // +type.split('#')[1])
      } else {
        this[type](array)
      }
    }
  }
}

export {BetterDataView_base}
