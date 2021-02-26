/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * If you use roslib in a browser, all the classes will be exported to a global variable called ROSLIB.
 *
 * If you use nodejs, this is the variable you get when you require('roslib')
 */

import core from './core';
import actionlib from './actionlib';
import math from './math';
import tf from './tf';
import urdf from './urdf';

var ROSLIB = {
  REVISION : '1.1.0'
};

export default {
  ...ROSLIB,
  ...core,
  ...actionlib,
  ...math,
  ...tf,
  ...urdf
};
