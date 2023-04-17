import cv from '@u4/opencv4nodejs'
import { Control } from './arducam16.mjs'
import { spawn } from 'child_process'
import WebSocket from 'ws'
import { EventEmitter } from 'node:events';

const defaults = {
  device: 0,
  width: 3840,
  height: 2160,
  windowName: 'Tapster',
  fps: 10, // frames per second  // FIXME: Hardcoded data
  delay: 1000 / 10,              // FIXME: Hardcoded data
  ffmpeg_bin: 'ffmpeg',
  mpegts_server: 'http://localhost:8081/live.stream'
}

const streamingDefaults = {

}

const username = 'tapster'        // FIXME: Hardcoded data
const password = 'tapster'        // FIXME: Hardcoded data
const auth = 'Basic ' + Buffer.from(username+ ':' + password).toString('base64')
let numberOfConnectedViewers = 0
var ws  // server connection

export class Vision extends EventEmitter {
  constructor(config) {
    super()
    this.config = {...defaults, ...config}
    this.frame = null
    this.editedFrame = null

    if (this.config.corners) {
      this.corners = this.config.corners
    }

    try {
      console.log('Tapster Vision Init...')
      this.cap = new cv.VideoCapture(this.config.device)
      this.cap.set(cv.CAP_PROP_FOURCC, cv.VideoWriter.fourcc("MJPG"))
      this.cap.set(cv.CAP_PROP_AUTOFOCUS, 1)
      this.cap.set(cv.CAP_PROP_AUTOFOCUS, 0)
      this.cap.set(cv.CAP_PROP_FRAME_WIDTH, this.config.width)
      this.cap.set(cv.CAP_PROP_FRAME_HEIGHT, this.config.height)
      this.cap.set(cv.CAP_PROP_FOCUS, 288)
      this.control = new Control({width: this.config.width, height: this.config.height})
      setTimeout(function() { this.control.init() }.bind(this), 4000)
      //this.init_ffmpeg()
      this.init_websocket()
    } catch(error) {
      console.log(error)
    }
  }

  init_ffmpeg() {
    this.ffmpeg_args = [
      //'-re',
      '-hide_banner',
      '-f', 'rawvideo',
      '-s', this.config.width + 'x' + this.config.height,
      '-pixel_format', 'bgr24',
      '-i', '-',
      '-pix_fmt', 'yuv420p',
      '-c:v', 'mpeg1video',
      '-bufsize', '20M',
      '-maxrate', '20M',
      '-f', 'mpegts',
      '-q', '2',   // set to '1' for highest quality, set to '31' for lowest quality
      //'-qmin', '1' // might be required for -q of 1
      this.config.mpegts_server
    ]
    //console.log(this.ffmpeg_args)
    this.ffmpeg = spawn(this.config.ffmpeg_bin, this.ffmpeg_args)

    this.ffmpeg.on('exit', function (code, signal) {
      console.log('child process exited with ' +
                  `code ${code} and signal ${signal}`)
    })

    this.ffmpeg.on("error", error => {
      console.log(`error: ${error.message}`);
    })

    this.ffmpeg.on("close", code => {
      console.log(`child process exited with code ${code}`);
    })

    this.ffmpeg.on("SIGINT", function() {
      console.log('SIGINT...\n');
      this.ffmpeg.exit();
    });

    this.ffmpeg.on('SIGTERM', function() {
      console.log('SIGTERM...\n');
      this.ffmpeg.exit();
    });

    this.ffmpeg.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })

    this.ffmpeg.stderr.on('data', (data) => {
      // console.error(`stderr: ${data}`);
    })
  }

  init_websocket() {
    this.ws_connect()
    this.ws_attachListeners()
  }

  ws_connect() {
    if (process.argv[2] == '--remote') {
      var url = 'wss://viewport.example.com/camera'  // FIXME: Hardcoded data
    } else {
      var url = 'ws://localhost:3000/camera'
    }
    ws = this.ws = new WebSocket(url, null, { headers: { Authorization: auth }})
    this.ws.parent = this
  }

  ws_attachListeners() {
    this.ws.on('error', function(error) {
      console.log('Could not connect to server')
      console.log('Error code: ' + error.message)
    })

    this.ws.on('open', function onOpen() {
      console.log("Web server: connected")
      //captureAndSend()
      //ws.send(JSON.stringify({'type': 'message', 'data': 'yo'}))
    })

    this.ws.on('message', function onMessage(message) {
      //console.log("Got message...")
      //console.log(message)
      try {
        var msg = JSON.parse(message)
        //console.log('Message type: ' + msg.type)
        //console.log('Message type: ' + msg.data)

        if (msg.type == 'mouseMove') {
          console.log('Got mouseMove!')
          var position = msg.data
          console.log(position)
          this.parent.emit('mouseMove', position)

        } else if (msg.type == 'mouseDown') {
          console.log('Got mouseDown!')
          var position = msg.data
          console.log(position)
          this.parent.emit('mouseDown', position)

        } else if (msg.type == 'mouseUp') {
          console.log('Got mouseUp!')
          var position = msg.data
          console.log(position)
          this.parent.emit('mouseUp', position)
        }


      } catch(err) {
        console.log("Couldn't parse message...")
      }

      if (msg.type == 'message') {
        if (msg.data.hasOwnProperty('viewers-connected')) {
          //console.log('Viewers connected: ', msg.data['viewers-connected'])
          numberOfConnectedViewers = msg.data['viewers-connected']
        }
      }

    })
  }


  view() {
    this.viewLoop = setInterval(() => {
      try {
        var frame = this.cap.read()
        this.frame = frame
        this.editFrame()
        this.findCorners()
        this.transform()

        //cv.imshow(this.config.windowName, this.frame)
        //cv.imshow(this.config.windowName + '-landscape', this.landscape)
        //cv.imshow(this.config.windowName + '-portrait', this.portrait)
        //cv.imshow(this.config.windowName + '-edit', this.editedFrame)
        //this.ffmpeg.stdin.write(this.frame.getData())

        // Send image to server
        if (numberOfConnectedViewers > 0) {
          var image = cv.imencode('.jpeg', this.portrait).toString('base64')
          //var image = cv.imencode('.jpeg', this.landscape).toString('base64')

          //console.log('Buffer size: ' + this.ws.bufferedAmount)
          this.ws.send(JSON.stringify({'type': 'image', 'data': image}))
          //console.log('Sending image (' + Math.round(image.length / 1024 * 100, 2) / 100 + ' kB)')
        }


        // Check if any key was pressed...
        var key = cv.waitKey(1)
        if (key != -1) {
          clearInterval(this.viewLoop)
        }
      } catch(err) {
        console.log(err)
      }
    }, this.config.delay)
  }

  editFrame() {
    // 1. Convert from RGB to grayscale (cvCvtColor)
    // 2. Smooth (GaussianBlur)
    // 3. Threshold (cvThreshold)
    // 4. Detect edges (Canny)
    this.editedFrame = this.frame.copy().
      cvtColor(cv.COLOR_BGR2GRAY).
      gaussianBlur(new cv.Size(5, 5), 1.5).
      threshold(90, 255, cv.THRESH_BINARY_INV).
      canny(30, 200)
  }

  findCorners() {
    // 5. Find contours (FindContours)
    // 6. Approximate contours with linear features (ApproxPoly)
    // 7. Find quadrangle
    var contours = this.editedFrame.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    for (var index in contours) {
      var perimeter = contours[index].arcLength(true)
      var approx = contours[index].approxPolyDP(0.01 * perimeter, true)

      if (approx.length == 4) {
        if (contours[index].area <= 100) {
          continue
        }
        //console.log(index, ': ', contours[index])
        if (!this.config.corners) {
          this.corners = approx
        }

        // Draw corners
        for (var pt of approx) {
          this.editedFrame.drawCircle(pt, 25, new cv.Vec(255, 0, 0), cv.FILLED)
        }
        //console.log(approx)
      }
    }
  }

  printCorners() {
    console.log('corners: [')
    for (var pt of this.corners) {
      console.log('  new cv.Point2(' + pt.x + ',' + pt.y + '),')
    }
    console.log(']')
  }

  transform() {
    var source = orderPoints(this.corners)
    var destination = [
      new cv.Point2(0,0),
      new cv.Point2(2048,0),
      new cv.Point2(2048,1536),
      new cv.Point2(0,1536)
    ]
    // var destination = [
    //   new cv.Point2(0,0),
    //   new cv.Point2(1200,0),
    //   new cv.Point2(1200,800),
    //   new cv.Point2(0,800)
    // ]

    var transformation = cv.getPerspectiveTransform(source, destination)
    var size = new cv.Size(2048,1536)
    //var size = new cv.Size(1200,800)
    this.editedFrame = this.editedFrame.warpPerspective(transformation, size)
    this.landscape = this.frame.warpPerspective(transformation, size)
    this.portrait = this.landscape.transpose().flip(1).resizeToMax(1500)
  }

}


var orderPoints = function(points) {
  // We need to determine correct order of points
  // (top-left, top-right, bottom-right, and bottom-left)

  // The top-left point has the smallest sum whereas the
  // bottom-right has the largest sum
  var sum = points.map(pt => pt.x + pt.y)
  var sumMin = Math.min(...sum)
  var sumMax = Math.max(...sum)
  var topLeftIndex = sum.indexOf(sumMin)
  var bottomRightIndex = sum.indexOf(sumMax)

  // Compute the difference between the points -- the top-right
  // will have the minumum difference and the bottom-left will
  // have the maximum difference
  var diff = points.map(pt => pt.y - pt.x)
  var diffMin = Math.min(...diff)
  var diffMax = Math.max(...diff)
  var topRightIndex = diff.indexOf(diffMin)
  var bottomLeftIndex = diff.indexOf(diffMax)

  var rect = [
    points[topLeftIndex],
    points[topRightIndex],
    points[bottomRightIndex],
    points[bottomLeftIndex]
  ]

  return rect
}


process.on("SIGINT", function() {
  //console.log('Exiting...\n')
  process.exit()
})

process.on('SIGTERM', function() {
  //console.log('Exiting...\n')
  process.exit()
})

process.on('exit', function () {
  console.log('\nExiting...\n')
  ws.terminate()
  process.exit()
})
