# Tapster Viewport Client
Client software for local control of a Tapster mobile device automation robot.

## Install Dependencies


### Install NVM

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

Exit terminal & relaunch to get new settings...

List available versions:

    nvm ls-remote

### Install latest long-term supported version of Node

(As of April 13, 2023)

    nvm install 18.16.0

## Install Dependencies: macOS

### Install Homebrew

    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

### Install cmake

    brew install cmake

## Install Dependencies: Linux

    sudo apt install build-essential cmake libudev-dev libgtk2.0-dev libcanberra-gtk-module ffmpeg v4l-utils


## Configure OpenCV

Create OpenCV folder:

    mkdir $HOME/Projects/opencv

Set environment variables:

    export OPENCV_BUILD_ROOT=~/Projects/opencv
    export OPENCV4NODEJS_DISABLE_AUTOBUILD=
    export OPENCV4NODEJS_AUTOBUILD_OPENCV_VERSION="4.6.0"
    export OPENCV_INCLUDE_DIR=~/Projects/opencv/opencv-4.6.0-8b1ea/build/include/opencv4/opencv2
    export OPENCV_LIB_DIR=~/Projects/opencv/opencv-4.6.0-8b1ea/build/lib
    export OPENCV_BIN_DIR=~/Projects/opencv/opencv-4.6.0-8b1ea/build/bin

Create symlink:

    mkdir -p ~/Projects/opencv/opencv-4.6.0-8b1ea/build/include/opencv4/opencv2
    ls -s ~/Projects/opencv/opencv-4.6.0-8b1ea/build/include/opencv4/opencv2 /usr/local/include/opencv2

## Install Viewport libraries (including OpenCV)
Along with the other requried libraries, this will download and build OpenCV into the folders specified above. On a relatively fast computer, this will take 10-15 minutes while OpenCV is compiled.

    git clone https://github.com/tapsterbot/viewport-client.git
    cd viewport-client
    npm install

## Change Hardcoded Variables
There's a bunch of them, sorry. 😬 These should all be changed to environment variables or command line flags.

### src/arducam.js

*Path to USB Camera*:

    63: var device = '/dev/video0'  // FIXME: Hardcoded path


This path can be found using v4l2-ctl:

    v4l2-ctl --list-devices
    Arducam_16MP: Arducam_16MP (usb-0000:00:14.0-1.1):
	    /dev/video0
        /dev/video1
        /dev/media0


### src/motion.js

*Path to ESP32 circuit board*:

    17: path: '/dev/ttyUSB0', // FIXME: Hardcoded path


### src/robot.js

*Update calibration data (lines 7-33)*:

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

*Update camera information (lines 39-53)*:

    var vision = new Vision({
      device: 0,                  // FIXME: Hardcoded camera device number
      width: 2592,                // FIXME: Hardcoded camera sensor resolution width
      height: 1944,               // FIXME: Hardcoded camera sensor resolution height
      //width: 3840,
      //height: 2160,
      corners: [
        new cv.Point2(468,286),   // FIXME: Hardcoded screen corner
        new cv.Point2(465,1621),  // FIXME: Hardcoded screen corner
        new cv.Point2(2237,1615), // FIXME: Hardcoded screen corner
        new cv.Point2(2237,293)   // FIXME: Hardcoded screen corner
      ],
      deviceWidth: 2048,          // FIXME: Hardcoded formatted image width
      deviceHeight: 1536,         // FIXME: Hardcoded formatted image height
    })


### src/vision.js

*Frames per second*:

    12:   fps: 10, // frames per second  // FIXME: Hardcoded data
    13:   delay: 1000 / 10,              // FIXME: Hardcoded data


*Server login name & password*:

    22: const username = 'tapster'        // FIXME: Hardcoded data
    23: const password = 'tapster'        // FIXME: Hardcoded data

*Remote server URL:*

    116:       var url = 'wss://viewport.example.com/camera'  // FIXME: Hardcoded data


## Run Viewport Client (Local)

    node src/robot.js
    
## Run Viewport Client (Remote)
This will connect over a websocket to a remotely running instance of Tapster Viewport Server

*Remote server URL specified on line 116 in `src/vision.js`*

    node src/robot.js --remote    
