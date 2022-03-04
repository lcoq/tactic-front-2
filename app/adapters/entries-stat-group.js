import ApplicationAdapter from './application';

export default class EntriesStatGroupAdapter extends ApplicationAdapter {
  pathForType() {
    return 'stats';
  }

  buildURL(modelName, id, snapshot, requestType, query) {
    if (requestType === 'queryRecord' && query._group) {
      let group = query._group;
      delete query._group;
      let serializedGroup = group === 'day' ? 'daily' : 'monthly';
      return super.buildURL(...arguments) + `/${serializedGroup}`;
    } else {
      return super.buildURL(...arguments);
    }
  }
}
