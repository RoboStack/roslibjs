/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

import Topic from '../core/Topic';
import Message from '../core/Message';
import EventEmitter2 from 'events';

/**
 * An actionlib action client.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal
 *  * 'status' - the status messages received from the action server
 *  * 'feedback' -  the feedback messages received from the action server
 *  * 'result' - the result returned from the action server
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * serverName - the action server name, like /fibonacci
 *   * actionName - the action message name, like 'actionlib_tutorials/FibonacciAction'
 *   * timeout - the timeout length when connecting to the action server
 */
class ActionClient extends EventEmitter2 {
  constructor(options) {
    super();
    options = options || {};
    this.ros = options.ros;
    this.serverName = options.serverName;
    this.actionName = options.actionName;
    this.timeout = options.timeout;
    this.omitFeedback = options.omitFeedback;
    this.omitStatus = options.omitStatus;
    this.omitResult = options.omitResult;
    this.goals = {};

    // flag to check if a status has been received
    let receivedStatus = false;

    // create the topics associated with actionlib
    this.feedbackListener = new Topic({
      ros : this.ros,
      name : this.serverName + '/feedback',
      messageType : this.actionName + 'Feedback'
    });

    this.statusListener = new Topic({
      ros : this.ros,
      name : this.serverName + '/status',
      messageType : 'actionlib_msgs/GoalStatusArray'
    });

    this.resultListener = new Topic({
      ros : this.ros,
      name : this.serverName + '/result',
      messageType : this.actionName + 'Result'
    });

    this.goalTopic = new Topic({
      ros : this.ros,
      name : this.serverName + '/goal',
      messageType : this.actionName + 'Goal'
    });

    this.cancelTopic = new Topic({
      ros : this.ros,
      name : this.serverName + '/cancel',
      messageType : 'actionlib_msgs/GoalID'
    });

    // advertise the goal and cancel topics
    this.goalTopic.advertise();
    this.cancelTopic.advertise();

    // subscribe to the status topic
    if (!this.omitStatus) {
      this.statusListener.subscribe(function(statusMessage) {
        receivedStatus = true;
        statusMessage.status_list.forEach((status) => {
          const goal = this.goals[status.goal_id.id];
          if (goal) {
            goal.emit('status', status);
          }
        });
      });
    }

    // subscribe the the feedback topic
    if (!this.omitFeedback) {
      this.feedbackListener.subscribe((feedbackMessage) => {
        const goal = this.goals[feedbackMessage.status.goal_id.id];
        if (goal) {
          goal.emit('status', feedbackMessage.status);
          goal.emit('feedback', feedbackMessage.feedback);
        }
      });
    }

    // subscribe to the result topic
    if (!this.omitResult) {
      this.resultListener.subscribe((resultMessage) => {
        const goal = this.goals[resultMessage.status.goal_id.id];

        if (goal) {
          goal.emit('status', resultMessage.status);
          goal.emit('result', resultMessage.result);
        }
      });
    }

    // If timeout specified, emit a 'timeout' event if the action server does not respond
    if (this.timeout) {
      setTimeout(() => {
        if (!receivedStatus) {
          this.emit('timeout');
        }
      }, this.timeout);
    }
  }

  /**
   * Cancel all goals associated with this ActionClient.
   */
  cancel = () => {
    const cancelMessage = new Message();
    this.cancelTopic.publish(cancelMessage);
  };

  /**
   * Unsubscribe and unadvertise all topics associated with this ActionClient.
   */
  dispose = () => {
    this.goalTopic.unadvertise();
    this.cancelTopic.unadvertise();
    if (!this.omitStatus) {this.statusListener.unsubscribe();}
    if (!this.omitFeedback) {this.feedbackListener.unsubscribe();}
    if (!this.omitResult) {this.resultListener.unsubscribe();}
  };

}

export default ActionClient;
