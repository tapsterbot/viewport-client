import cv from '@u4/opencv4nodejs'
import repl from 'repl'
import { Vision } from './vision.js'
import { Motion } from './motion.js'
import { Calibrate } from './calibrate.js'

// Portrait
var portrait = new Calibrate({
  surface: {z: -30},
  safety: {z: -15},
  point1: {
    robot:{x: 0, y: 50},      // FIXME: Hardcoded data
    screen:{x: 360, y: 235}   // FIXME: Hardcoded data
  },
  point2: {
    robot:{x: 0, y: -50},     // FIXME: Hardcoded data
    screen:{x: 385, y: 746}   // FIXME: Hardcoded data
  }
})

// Landscape
var landscape = new Calibrate({
  surface: {z: -30},
  safety: {z: -15},
  point1: {
    robot:{x: 0, y: 50},      // FIXME: Hardcoded data
    screen:{x: 239, y: 403}   // FIXME: Hardcoded data
  },
  point2: {
    robot:{x: 0, y: -50},     // FIXME: Hardcoded data
    screen:{x: 751, y: 380}   // FIXME: Hardcoded data
  }
})

var calibration = portrait

var motion = new Motion()

var vision = new Vision({
  device: 0,                  // FIXME: Hardcoded data
  width: 2592,                // FIXME: Hardcoded data
  height: 1944,               // FIXME: Hardcoded data
  //width: 3840,
  //height: 2160,
  corners: [
    new cv.Point2(468,286),   // FIXME: Hardcoded data
    new cv.Point2(465,1621),  // FIXME: Hardcoded data
    new cv.Point2(2237,1615), // FIXME: Hardcoded data
    new cv.Point2(2237,293)   // FIXME: Hardcoded data
  ],
  deviceWidth: 2048,          // FIXME: Hardcoded data
  deviceHeight: 1536,         // FIXME: Hardcoded data
})

vision.view()

vision.on('mouseDown', (data) => {
  //var transformedPoint = calibration.transformPoint(data.x,data.y)
  //motion.go(transformedPoint.x, transformedPoint.y)
  var transformedPoint = calibration.transformPoint(data.x,data.y)

  setTimeout(function() {
    motion.go(transformedPoint.x, transformedPoint.y, calibration.config.safety.z)
  }, 0)

  setTimeout(function() {
    motion.go(transformedPoint.x, transformedPoint.y, calibration.config.surface.z)
  }, 100)

})

vision.on('mouseMove', (data) => {
  //var transformedPoint = calibration.transformPoint(data.x,data.y)
  //motion.go(transformedPoint.x, transformedPoint.y)
  var transformedPoint = calibration.transformPoint(data.x,data.y)

  setTimeout(function() {
    motion.go(transformedPoint.x, transformedPoint.y)
  }, 100)

})

vision.on('mouseUp', (data) => {
  var transformedPoint = calibration.transformPoint(data.x,data.y)

  //setTimeout(function() {
  //  motion.go(transformedPoint.x, transformedPoint.y, calibration.config.safety.z)
  //}, 0)

  //setTimeout(function() {
  //  motion.go(transformedPoint.x, transformedPoint.y, calibration.config.surface.z)
  //}, 600)

  setTimeout(function() {
    motion.go(transformedPoint.x, transformedPoint.y, calibration.config.safety.z)
  }, 200)

  //setTimeout(function() {
  //  motion.go(0, -120, 25)
  //}, 750)
})



setTimeout(function() {
  var replServer = repl.start('> ')
  replServer.context.vision = vision
  replServer.context.motion = motion
  replServer.context.calibration = calibration
  replServer.context.cv = cv
}, 4000)
