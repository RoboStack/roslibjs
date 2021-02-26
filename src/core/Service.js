/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import ServiceResponse from './ServiceResponse';
import EventEmitter2 from 'events';

/**
 * A ROS service client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like /add_two_ints
 *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
 */
class Service extends EventEmitter2{

  constructor(options) {
    super();
    options = options || {};
    this.ros = options.ros;
    this.name = options.name;
    this.serviceType = options.serviceType;
    this.isAdvertised = false;

    this._serviceCallback = null;
  }

  /**
   * Calls the service. Returns the service response in the
   * callback. Does nothing if this service is currently advertised.
   *
   * @param request - the ROSLIB.ServiceRequest to send
   * @param callback - function with params:
   *   * response - the response from the service request
   * @param failedCallback - the callback function when the service call failed (optional). Params:
   *   * error - the error message reported by ROS
   */
  callService = (request, callback, failedCallback) => {
    if (this.isAdvertised) {
      return;
    }

    const serviceCallId = 'call_service:' + this.name + ':' + (++this.ros.idCounter);

    if (callback || failedCallback) {
      this.ros.once(serviceCallId, function(message) {
        if (message.result !== undefined && message.result === false) {
          if (typeof failedCallback === 'function') {
            failedCallback(message.values);
          }
        } else if (typeof callback === 'function') {
          callback(new ServiceResponse(message.values));
        }
      });
    }

    const call = {
      op : 'call_service',
      id : serviceCallId,
      service : this.name,
      type: this.serviceType,
      args : request
    };
    this.ros.callOnConnection(call);
  };

  /**
   * Advertise the service. This turns the Service object from a client
   * into a server. The callback will be called with every request
   * that's made on this service.
   *
   * @param callback - This works similarly to the callback for a C++ service and should take the following params:
   *   * request - the service request
   *   * response - an empty dictionary. Take care not to overwrite this. Instead, only modify the values within.
   *   It should return true if the service has finished successfully,
   *   i.e. without any fatal errors.
   */
  advertise = (callback) => {
    if (this.isAdvertised || typeof callback !== 'function') {
      return;
    }

    this._serviceCallback = callback;
    this.ros.on(this.name, this._serviceResponse.bind(this));
    this.ros.callOnConnection({
      op: 'advertise_service',
      type: this.serviceType,
      service: this.name
    });
    this.isAdvertised = true;
  };

  unadvertise = () => {
    if (!this.isAdvertised) {
      return;
    }
    this.ros.callOnConnection({
      op: 'unadvertise_service',
      service: this.name
    });
    this.isAdvertised = false;
  };

  _serviceResponse = (rosbridgeRequest) => {
    const response = {};
    const success = this._serviceCallback(rosbridgeRequest.args, response);

    const call = {
      op: 'service_response',
      service: this.name,
      values: new ServiceResponse(response),
      result: success
    };

    if (rosbridgeRequest.id) {
      call.id = rosbridgeRequest.id;
    }

    this.ros.callOnConnection(call);
  };
}

export default Service;
