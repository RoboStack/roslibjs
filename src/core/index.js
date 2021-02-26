import mixin from '../mixin';

import Ros from './Ros';
import Topic from './Topic';
import Message from './Message';
import Param from './Param';
import Service from './Service';
import ServiceRequest from './ServiceRequest';
import ServiceResponse from './ServiceResponse';

const core = {
    Ros,
    Topic,
    Message,
    Param,
    Service,
    ServiceRequest,
    ServiceResponse
};

mixin(core.Ros, ['Param', 'Service', 'Topic'], core);

export default core;
