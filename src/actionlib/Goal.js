/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

import Message from '../core/Message';
import EventEmitter2 from 'events';

/**
 * An actionlib goal goal is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal
 *
 *  @constructor
 *  @param object with following keys:
 *   * actionClient - the ROSLIB.ActionClient to use with this goal
 *   * goalMessage - The JSON object containing the goal for the action server
 */
class Goal extends EventEmitter2 {
  constructor(options) {
    super();
    this.actionClient = options.actionClient;
    this.goalMessage = options.goalMessage;
    this.isFinished = false;

    // Used to create random IDs
    const date = new Date();

    // Create a random ID
    this.goalID = 'goal_' + Math.random() + '_' + date.getTime();
    // Fill in the goal message
    this.goalMessage = new Message({
      goal_id : {
        stamp : {
          secs : 0,
          nsecs : 0
        },
        id : this.goalID
      },
      goal : this.goalMessage
    });

    this.on('status', (status) => {
      this.status = status;
    });

    this.on('result', (result) => {
      this.isFinished = true;
      this.result = result;
    });

    this.on('feedback', (feedback) => {
      this.feedback = feedback;
    });

    // Add the goal
    this.actionClient.goals[this.goalID] = this;
  }

  /**
   * Send the goal to the action server.
   *
   * @param timeout (optional) - a timeout length for the goal's result
   */
  send = (timeout) => {
    this.actionClient.goalTopic.publish(this.goalMessage);
    if (timeout) {
      setTimeout(() => {
        if (!this.isFinished) {
          this.emit('timeout');
        }
      }, timeout);
    }
  };

  /**
   * Cancel the current goal.
   */
  cancel = () => {
    const cancelMessage = new Message({
      id : this.goalID
    });
    this.actionClient.cancelTopic.publish(cancelMessage);
  };
}

export default Goal;
