import Ros from '../core/Ros';
import mixin from '../mixin';
import TFClient from './TFClient';

const tf = {
    TFClient
};

mixin(Ros, ['TFClient'], tf);

export default tf;
