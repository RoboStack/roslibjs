/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import Vector3 from './Vector3';
import Quaternion from './Quaternion';

/**
 * A Pose in 3D space. Values are copied into this object.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * position - the Vector3 describing the position
 *   * orientation - the ROSLIB.Quaternion describing the orientation
 */
class Pose{
  constructor(options) {
    options = options || {};
    // copy the values into this object if they exist
    this.position = new Vector3(options.position);
    this.orientation = new Quaternion(options.orientation);
  }

  /**
   * Apply a transform against this pose.
   *
   * @param tf the transform
   */
  applyTransform = (tf) => {
    this.position.multiplyQuaternion(tf.rotation);
    this.position.add(tf.translation);
    const tmp = tf.rotation.clone();
    tmp.multiply(this.orientation);
    this.orientation = tmp;
  };

  /**
   * Clone a copy of this pose.
   *
   * @returns the cloned pose
   */
  clone = () => {
    return new Pose(this);
  };

  /**
   * Multiplies this pose with another pose without altering this pose.
   *
   * @returns Result of multiplication.
   */
  multiply = (pose) => {
    const p = pose.clone();
    p.applyTransform({ rotation: this.orientation, translation: this.position });
    return p;
  };

  /**
   * Computes the inverse of this pose.
   *
   * @returns Inverse of pose.
   */
  getInverse = () => {
    const inverse = this.clone();
    inverse.orientation.invert();
    inverse.position.multiplyQuaternion(inverse.orientation);
    inverse.position.x *= -1;
    inverse.position.y *= -1;
    inverse.position.z *= -1;
    return inverse;
  };
}

export default Pose;
