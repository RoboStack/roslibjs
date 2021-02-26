/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import Vector3 from '../math/Vector3';
import UrdfTypes from './UrdfTypes';

/**
 * A Box element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfBox(options) {
  this.dimension = null;
  this.type = UrdfTypes.URDF_BOX;

  // Parse the xml string
  var xyz = options.xml.getAttribute('size').split(' ');
  this.dimension = new Vector3({
    x : parseFloat(xyz[0]),
    y : parseFloat(xyz[1]),
    z : parseFloat(xyz[2])
  });
}

export default UrdfBox;
