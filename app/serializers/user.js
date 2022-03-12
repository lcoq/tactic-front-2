import ApplicationSerializer from './application';

export default class UserSerializer extends ApplicationSerializer {
  extractAttributes(/* modelClass, resourceHash */) {
    const extracted = super.extractAttributes(...arguments);
    extracted.password = null;
    return extracted;
  }
}
