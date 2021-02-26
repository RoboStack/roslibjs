import Ros from '../core/Ros';
import mixin from '../mixin';

import ActionClient from './ActionClient';
import ActionListener from './ActionListener';
import Goal from './Goal';
import SimpleActionServer from './SimpleActionServer';

const action = {
    ActionClient,
    ActionListener,
    Goal,
    SimpleActionServer
};

mixin(Ros, ['ActionClient', 'SimpleActionServer'], action);

export default action;
