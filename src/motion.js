import { EventEmitter } from 'node:events'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'

const defaults = {}

export class Motion extends EventEmitter {
  constructor(config = {}) {
    super()
    this.config = {...defaults, ...config}
    this.init()
  }

  init() {
    // Create a port
    this.port = new SerialPort({
      path: '/dev/ttyUSB0', // FIXME: Hardcoded path
      baudRate: 115200,
    })

    this.parser = new ReadlineParser()
    this.port.pipe(this.parser)

    // // The open event is always emitted
    // this.port.on('open', function() {
    //   console.log('Serial port open')
    // })
    //
    // // Read data that is available but keep the stream in "paused mode"
    // this.port.on('readable', function () {
    //   console.log('Data:', this.port.read())
    // })

    this.port.on('open', this.onPortOpen)
    this.parser.on('data', this.onReadData)
    this.port.on('close', this.onPortClose);
    this.port.on('error', this.onError);
  }

  onPortOpen() {
    console.log('Serial port: connected')
  }

  onReadData(data) {
    console.log(data)
  }

  onPortClose() {
    console.log('Serial port closed')
  }

  onError(error) {
    console.log('Serial port error: ' + error)
  }

  home() {
    this.port.write('G0 X0 Y0 Z0\n')
  }

  go(x=0, y=0, z=null) {
    var zStr
    if (z != null) {
      zStr = `Z${z}`
    } else {
      zStr = ''
    }
    console.log(zStr)
    var gcode = `G0 X${x} Y${y} ${zStr}\n`
    console.log(gcode)
    this.port.write(gcode)
  }

}

//
// let parser = new Readline(); // make a new parser to read ASCII lines
// myPort.pipe(parser); // pipe the serial stream to the parser
//
//



// port.write('$+', function(err) {
//   if (err) {
//     return console.log('Error on write: ', err.message)
//   }
//   console.log('message written')
// })
