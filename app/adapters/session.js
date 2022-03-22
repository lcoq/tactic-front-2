import ApplicationAdapter from './application';

export default class SessionAdapter extends ApplicationAdapter {
  urlForCreateRecord(modelName, snapshot) {
    let url = super.urlForCreateRecord(...arguments);
    if (snapshot.adapterOptions && snapshot.adapterOptions.include) {
      url += `?include=${snapshot.adapterOptions.include}`;
    }
    return url;
  }
}
