
import {BetterDataView_base} from "./base.js"
import {replaceAll, jpp, assert} from "./misc.js"
//todo: should remember start+end offset for written object, so it can be returned as a new DataView: b.lastObject() ?
class BetterDataView_rwObject extends BetterDataView_base {
  _evalSize(sizeString, object) {
    return Function(`return ${sizeString}`).bind(object)() //'use strict'
  }
  _getType(typeString, object) {
    let typeFunction, type, size = [0,0]
    let s = typeString.split(',') // split at each array-size-identifier
    if (s[0][0] == 's') { // if type is a string
      type = 'string'
      if (s[0].indexOf(':') != -1) { // if string has a size specifier
        size[0] = this._evalSize(s[0].split(':')[1], object)
      } else {
        size[0] = 0 // null terminated
      }
    } else { // if other type
      switch (s[0]) {
        case 'date':
        case 'unixtime':
          type = s[0]
        break
        case '':
        case 'null':
          type = 'null'
        break
        default:
          type = 'number'
          typeFunction = s[0]
      }
    }
    if (s.length > 1) { // if array
      if (type == 'string') { // if array of strings
        typeFunction = 'string'
      }
      type = 'array'
      size[1] = s.slice(1) //value = readArray(s.slice(1), ()=>readValue(this, typeFunction) )
      size[1].forEach((value,index) => {
        size[1][index] = this._evalSize(value, object)
      })
    }
    
    return {typeFunction, type, size}
  }
  readObject(template) {
    let object = {} // the new object
    
    /*function readValue(dataView, typeFunction) {
      return Function('dataView', `return dataView.${typeFunction}()`)(dataView)
    }*/
    
    function readArray(sizeArray, callback) {
      if (sizeArray.length) {
        let array = new Array(+sizeArray[0]) // + forces int conversion
        array.fill(null)
        for (let i=0; i<array.length; i++) {
          array[i] = readArray(sizeArray.slice(1), callback)
        }
        return array
      }
      return callback()
    }
    
    Object.entries(template).forEach(([tKey, tValue]) => {
      let value
      if (typeof tValue == 'string') { // .replace(/\|/g, '|');
        let {typeFunction, type, size} = this._getType(tValue, object)
        switch (type) {
          case 'string': value = this.readString(size[0]); break
          case 'number': value = this[typeFunction]();break//readValue(this, typeFunction); break
          case 'array':  value = readArray(size[1], ()=>{
            if (typeFunction == 'string') {
              return this.readString(size[0])
            } else {
              return this[typeFunction]()
            }
            });
            break
          case 'date': value = this.readTime(true); break
          case 'unixtime': value = this.readTime(); break
          case 'null': break
        }
      } else if (Array.isArray(tValue)) {
        let size = this._evalSize(tValue[0], object)
        value = new Array(size)
        for (let i=0; i<value.length; i++) {
          value[i] = this.readObject(tValue[1])
        }
      } else if (typeof tValue == 'object') {
        value = this.readObject(tValue)
      }
      object[tKey] = value
    })
    return object
  }
  writeObject(template, object) {
    /*function writeValue(dataView, typeFunction, value) {
      return Function('dataView', `return dataView.${typeFunction}(${value})`)(dataView)
    }*/
    
    function assert_string(oValue, size, tKey, tValue) {
      assert(typeof oValue == 'string', 
        "Template expected a string, but "
        +`${typeof oValue} '${oValue}' was given.`
        +`\nTemplate definition: ${tKey}: '${tValue}'`
      )
      if (size) { // fixed to count UTF-8 chars
        // thanks to: https://dev.to/coolgoose/quick-and-easy-way-of-counting-utf-8-characters-in-javascript-23ce
        assert(size == [...oValue].length, //oValue.length,
          "Template/object string size mismatch."
          +`\nTemplate definition: ${tKey}: '${tValue}'`
          +`\nSize of '${oValue}' (${[...oValue].length}) != ${size}`
        )
      }
    }
    function assert_number(oValue, tKey, tValue) {
      assert(typeof oValue == 'number' || typeof oValue == 'boolean', 
        "Template expected a number, but "
        +`${typeof oValue} '${oValue}' was given.`
        +`\nTemplate definition: ${tKey}: '${tValue}'`
      )
    }
    const isIterable = object => object != null && typeof object[Symbol.iterator] === 'function'
    function assert_array(oValue, tKey, tValue) {
      assert(isIterable(oValue),//Array.isArray(oValue), // isIterable makes it work with typed arrays e.g.
        "Template expected an array/iterable, but "
        +typeof oValue+" was given."
        +`\nTemplate definition: ${tKey}: '${tValue}'`
        )
    }
    function assert_object(oValue, tKey, tValue) {
      assert(typeof oValue == 'object', 
        'Template expected an object, but '
        +`${typeof oValue} '${oValue}' was given.`
        +`\nTemplate definition: ${tKey}: '${tValue}'`
      )
    }
    
    function writeArray(sizeArray, array, callback) {
      if (sizeArray.length) {
        assert(+sizeArray[0] == array.length, 
          "Template/object array size mismatch."
          +'\nExpected array of size '+sizeArray[0]
          +' got array of size '+array.length
          //+`\nTemplate definition: ${templateArr[i][0]}: '${templateArr[i][1]}'`
        )
        for (let i=0; i<+sizeArray[0]; i++) {
          writeArray(sizeArray.slice(1), array[i], callback)
        }
        return
      }
      callback(array) //writeValue(this, typeFunction, array)
    }
    
    assert(typeof object == 'object', 
      'Object/subobject write error'
    )
    let templateArr = Object.entries(template)
    let objectArr   = Object.entries(object)
    assert(templateArr.length == objectArr.length, "Template/object size mismatch\n"+templateArr+"\n-\n"+objectArr)
    for (let i=0; i<templateArr.length; i++) {
      let tKey   = templateArr[i][0] // key means title of property
      let tValue = templateArr[i][1]
      let oKey   = objectArr[i][0]
      let oValue = objectArr[i][1]
      assert(tKey == oKey, "Template/object property name/order mismatch")
      if (typeof tValue == 'string') {
        let {typeFunction, type, size} = this._getType(tValue, object)
        switch (type) {
          case 'string':
            assert_string(oValue, size[0], tKey, tValue)
            if (size[0]) {
              //console.log('false')
              this.writeString(oValue, false)
            } else {
              //console.log('true')
              this.writeString(oValue)
            }
          break
          case 'number':
            assert_number(oValue, tKey, tValue)
            this[typeFunction](oValue);
          break
          case 'array': 
            assert_array(oValue, tKey, tValue)
            //console.log(size[1])
            writeArray(size[1], oValue, value => {
              if (typeFunction == 'string') {
                assert_string(value, size[0], tKey, tValue)
                if (size[0]) {
                  this.writeString(value, false)
                } else {
                  this.writeString(value)
                }
              } else {
                assert_number(value, tKey, tValue)
                this[typeFunction](value)
              }
            })
          break
          case 'date': this.writeTime(oValue,true); break
          case 'unixtime': this.writeTime(oValue); break
          case 'null': break
        }
      } else if (Array.isArray(tValue)) {
        let size = this._evalSize(tValue[0], object)
        assert(size == oValue.length, 
          'Object-array size mismatch'
          +`\nTemplate definition: ${tKey}: '${tValue}'`
        )
        /*oValue.forEach((value)=>{ // for (let value of array) { 
          
        })*/
        for (let i=0; i<size; i++) {
          assert_object(oValue[i], tKey, tValue[1])
          this.writeObject(tValue[1], oValue[i])
        }
      } else if (typeof tValue == 'object') {
        this.writeObject(tValue, oValue)
      }
    }
  }
}

export {BetterDataView_rwObject}
