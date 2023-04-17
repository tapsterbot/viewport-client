//  Calibration Routine
//
//    findSurfaceLocation
//      move pointer to a position over screen
//      lower z until screen is touched
//      store z-height
//
//    findPoint1
//      move pointer to (svg) 0,-30
//      lower to screen surface
//      store location
//
//    findPoint2
//      move pointer to (svg) 0,30
//      lower to screen surface
//      store location
//
//    calcTransformationMatrix

import * as math from "mathjs"

const defaults = {}

export class Calibrate {
  constructor(config = {}) {
    this.config = {...defaults, ...config}
    this.transformationMatrix = []
    this.init()
  }

  init() {
     this.calcTransformationMatrix()
  }

  calcTransformationMatrix() {
    // Based on "How to map points between 2D coordinate systems"
    // https://msdn.microsoft.com/en-us/library/jj635757(v=vs.85).aspx

    var point1 = this.config.point1
    var point2 = this.config.point2

    //if (JSON.stringify(this.point1.screen) === '{}' || JSON.stringify(this.point2.screen) === '{}') {
    //  console.log('Need to calibrate first. Trying running robot.tap' + this.tapId + '.calibrate()')
    //  return
    //}

    var M = math.matrix([
      [ point1.screen.x, point1.screen.y, 1, 0],
      [-point1.screen.y, point1.screen.x, 0, 1],
      [ point2.screen.x, point2.screen.y, 1, 0],
      [-point2.screen.y, point2.screen.x, 0, 1]
    ])

    var u = math.matrix([
      [point1.robot.x],
      [point1.robot.y],
      [point2.robot.x],
      [point2.robot.y]
    ])

    var MI = math.inv(M)
    var v = math.multiply(MI, u)
    this.transformationMatrix = v
  }

  transformPoint(x, y) {
    if (JSON.stringify(this.transformationMatrix) === '[]' ) {
      return
    }

    var v = this.transformationMatrix
    var a = v.get([0,0])
    var b = v.get([1,0])
    var c = v.get([2,0])
    var d = v.get([3,0])

    var xprime = ( (a * x) + (b * y) + c)
    var yprime = (b * x) - (a * y) + d

    return {x: xprime, y: yprime}
  }
}