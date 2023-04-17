// https://github.com/qweasd1/node-uvc-control (npm uvc-control2)

// Example
// import { Control } from './arducam16.mjs'
// var control = new Control({width: this.config.width, height: this.config.height})
// control.init()

import UVCControl from 'uvc-control2'
import {execSync as exec} from 'child_process'
//var exec = require('child_process').execSync

const defaults = {
    width: 3840,
    height: 2160
}

export class Control {
  constructor(config) {
    this.config = {...defaults, ...config}
    if (process.platform == 'darwin') {
      try {
        console.log('Camera: connected')
        this.control = new UVCControl({vid: 0xc45, pid: 0x636d, processingUnitId: 0x02})
      } catch(error) {
        console.log(error)
      }
    } else if (process.platform == 'linux') {
      this.control = {}
    }
  }


  init() {
    if (process.platform == 'darwin') {
      try {
        this.control.set('autoFocus', 0x01).
          then(sleeper(200)).
          then((result) => this.control.set('autoFocus', 0x00)).
          then(sleeper(200)).
          then((result) => this.control.set('absoluteFocus', 325)).
          then((result) => this.control.set('autoExposureMode', 0x01)).
          then((result) => this.control.set('absoluteExposureTime', 500)).
          then((result) => this.control.set('gain', 6)).
          then((result) => this.control.set('autoWhiteBalance', 0x01)).
          then(sleeper(1000)).
          //then((result) => this.control.set('autoWhiteBalance', 0x00)).
          //then(sleeper(200)).
          //then((result) => this.control.set('whiteBalanceTemperature', 2820)).
      // [ 2800, 6500 ]
          then((result) => console.log('Camera controls set'))
      } catch(error) {
        console.log('Error on camera init')
        console.log(error)
      }
    } else if (process.platform == 'linux') {
      // FIXME: Introspect for the correct device number for Arducam
      //$ v4l2-ctl --list-devices
      //  Arducam_16MP: Arducam_16MP (usb-0000:00:14.0-1.1):
      //    /dev/video0
      //    /dev/video1
      //    /dev/media0
      console.log('Configuring camera on Linux...')
      var device = '/dev/video0'    // FIXME: Hardcoded path
      console.log(exec('v4l2-ctl --device ' + device + ' --set-ctrl=focus_automatic_continuous=0').toString())
      exec('sleep 1')
      exec('v4l2-ctl --device ' + device + ' --set-ctrl=focus_absolute=325')
      exec('sleep 1')
      exec('v4l2-ctl --device ' + device + ' --set-ctrl=auto_exposure=1')
      exec('sleep 1')
      exec('v4l2-ctl --device ' + device + ' --set-ctrl=exposure_time_absolute=200')
      exec('sleep 1')
      exec('v4l2-ctl --device ' + device + ' --set-ctrl=gain=6')
      exec('sleep 1')
      //exec('v4l2-ctl --device ' + device + ' --set-ctrl=white_balance_automatic=0')
      //exec('sleep 1')
      //exec('v4l2-ctl --device ' + device + ' --set-ctrl=white_balance_temperature=2820')
      //exec('sleep 1')
    }
  }

}


function sleeper(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}
