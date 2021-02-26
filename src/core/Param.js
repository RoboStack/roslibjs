/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import Service from './Service';
import ServiceRequest from './ServiceRequest';

/**
 * A ROS parameter.
 *
 * @constructor
 * @param options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the param name, like max_vel_x
 */
class Param {
  constructor(options) {
    options = options || {};
    this.ros = options.ros;
    this.name = options.name;
  }

  /**
   * Fetches the value of the param.
   *
   * @param callback - function with the following params:
   *  * value - the value of the param from ROS.
   */
  get = (callback) => {
    const paramClient = new Service({
      ros : this.ros,
      name : '/rosapi/get_param',
      serviceType : 'rosapi/GetParam'
    });

    const request = new ServiceRequest({
      name : this.name
    });

    paramClient.callService(request, (result) => {
      const value = JSON.parse(result.value);
      callback(value);
    });
  };

  /**
   * Sets the value of the param in ROS.
   *
   * @param value - value to set param to.
   */
  set = (value, callback) => {
    const paramClient = new Service({
      ros : this.ros,
      name : '/rosapi/set_param',
      serviceType : 'rosapi/SetParam'
    });

    const request = new ServiceRequest({
      name : this.name,
      value : JSON.stringify(value)
    });

    paramClient.callService(request, callback);
  };

  /**
   * Delete this parameter on the ROS server.
   */
  delete = (callback) => {
    const paramClient = new Service({
      ros : this.ros,
      name : '/rosapi/delete_param',
      serviceType : 'rosapi/DeleteParam'
    });

    const request = new ServiceRequest({
      name : this.name
    });

    paramClient.callService(request, callback);
  };
}

export default Param;
