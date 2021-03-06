/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import ActionClient from '../actionlib/ActionClient';
import Goal from '../actionlib/Goal';

import Service from '../core/Service.js';
import ServiceRequest from '../core/ServiceRequest.js';
import Topic from '../core/Topic.js';

import Transform from '../math/Transform';

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * fixedFrame - the fixed frame, like /base_link
 *   * angularThres - the angular threshold for the TF republisher
 *   * transThres - the translation threshold for the TF republisher
 *   * rate - the rate for the TF republisher
 *   * updateDelay - the time (in ms) to wait after a new subscription
 *                   to update the TF republisher's list of TFs
 *   * topicTimeout - the timeout parameter for the TF republisher
 *   * serverName (optional) - the name of the tf2_web_republisher server
 *   * repubServiceName (optional) - the name of the republish_tfs service (non groovy compatibility mode only)
 *   																 default: '/republish_tfs'
 */
class TFClient {
  constructor(options = {}) {
    this.ros = options.ros;
    this.fixedFrame = options.fixedFrame || '/base_link';
    this.angularThres = options.angularThres || 2.0;
    this.transThres = options.transThres || 0.01;
    this.rate = options.rate || 10.0;
    this.updateDelay = options.updateDelay || 50;
    const seconds = options.topicTimeout || 2.0;
    const secs = Math.floor(seconds);
    const nsecs = Math.floor((seconds - secs) * 1000000000);
    this.topicTimeout = {
      secs: secs,
      nsecs: nsecs
    };
    this.serverName = options.serverName || '/tf2_web_republisher';
    this.repubServiceName = options.repubServiceName || '/republish_tfs';

    this.currentGoal = false;
    this.currentTopic = false;
    this.frameInfos = {};
    this.republisherUpdateRequested = false;
    this._subscribeCB = null;

    // Create an Action client
    this.actionClient = new ActionClient({
      ros : options.ros,
      serverName : this.serverName,
      actionName : 'tf2_web_republisher/TFSubscriptionAction',
      omitStatus : true,
      omitResult : true
    });

    // Create a Service client
    this.serviceClient = new Service({
      ros: options.ros,
      name: this.repubServiceName,
      serviceType: 'tf2_web_republisher/RepublishTFs'
    });
  }

  /**
   * Process the incoming TF message and send them out using the callback
   * functions.
   *
   * @param tf - the TF message from the server
   */
  processTFArray = (tf) => {
    tf.transforms.forEach((transform) => {
      let frameID = transform.child_frame_id;
      if (frameID[0] === '/')
      {
        frameID = frameID.substring(1);
      }
      const info = this.frameInfos[frameID];
      if (info) {
        info.transform = new Transform({
          translation : transform.transform.translation,
          rotation : transform.transform.rotation
        });
        info.cbs.forEach((cb) => {
          cb(info.transform);
        });
      }
    }, this);
  };

  /**
   * Create and send a new goal (or service request) to the tf2_web_republisher
   * based on the current list of TFs.
   */
  updateGoal = () => {
    const goalMessage = {
      source_frames : Object.keys(this.frameInfos),
      target_frame : this.fixedFrame,
      angular_thres : this.angularThres,
      trans_thres : this.transThres,
      rate : this.rate
    };

    // if we're running in groovy compatibility mode (the default)
    // then use the action interface to tf2_web_republisher
    if(this.ros.groovyCompatibility) {
      if (this.currentGoal) {
        this.currentGoal.cancel();
      }
      this.currentGoal = new Goal({
        actionClient : this.actionClient,
        goalMessage : goalMessage
      });

      this.currentGoal.on('feedback', this.processTFArray.bind(this));
      this.currentGoal.send();
    }
    else {
      // otherwise, use the service interface
      // The service interface has the same parameters as the action,
      // plus the timeout
      goalMessage.timeout = this.topicTimeout;
      const request = new ServiceRequest(goalMessage);

      this.serviceClient.callService(request, this.processResponse.bind(this));
    }

    this.republisherUpdateRequested = false;
  };

  /**
   * Process the service response and subscribe to the tf republisher
   * topic
   *
   * @param response the service response containing the topic name
   */
  processResponse = (response) => {
    // if we subscribed to a topic before, unsubscribe so
    // the republisher stops publishing it
    if (this.currentTopic) {
      this.currentTopic.unsubscribe(this._subscribeCB);
    }

    this.currentTopic = new Topic({
      ros: this.ros,
      name: response.topic_name,
      messageType: 'tf2_web_republisher/TFArray'
    });
    this._subscribeCB = this.processTFArray.bind(this);
    this.currentTopic.subscribe(this._subscribeCB);
  };

  /**
   * Subscribe to the given TF frame.
   *
   * @param frameID - the TF frame to subscribe to
   * @param callback - function with params:
   *   * transform - the transform data
   */
  subscribe = (frameID, callback) => {
    // remove leading slash, if it's there
    if (frameID[0] === '/')
    {
      frameID = frameID.substring(1);
    }
    // if there is no callback registered for the given frame, create emtpy callback list
    if (!this.frameInfos[frameID]) {
      this.frameInfos[frameID] = {
        cbs: []
      };
      if (!this.republisherUpdateRequested) {
        setTimeout(this.updateGoal.bind(this), this.updateDelay);
        this.republisherUpdateRequested = true;
      }
    }
    // if we already have a transform, call back immediately
    else if (this.frameInfos[frameID].transform) {
      callback(this.frameInfos[frameID].transform);
    }
    this.frameInfos[frameID].cbs.push(callback);
  };

  /**
   * Unsubscribe from the given TF frame.
   *
   * @param frameID - the TF frame to unsubscribe from
   * @param callback - the callback function to remove
   */
  unsubscribe = (frameID, callback) => {
    // remove leading slash, if it's there
    if (frameID[0] === '/')
    {
      frameID = frameID.substring(1);
    }
    const info = this.frameInfos[frameID];
    for (let cbs = info && info.cbs || [], idx = cbs.length; idx--;) {
      if (cbs[idx] === callback) {
        cbs.splice(idx, 1);
      }
    }
    if (!callback || cbs.length === 0) {
      delete this.frameInfos[frameID];
    }
  };

  /**
   * Unsubscribe and unadvertise all topics associated with this TFClient.
   */
  dispose = () => {
    this.actionClient.dispose();
    if (this.currentTopic) {
      this.currentTopic.unsubscribe(this._subscribeCB);
    }
  };
}

export default TFClient;
