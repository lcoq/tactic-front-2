import ApplicationAdapter from './application';

export default class UserConfigAdapter extends ApplicationAdapter {
  urlForUpdateRecord(id, modelName, snapshot) {
    const userId = snapshot.belongsTo('user').id;
    return `${this.host}/users/${userId}/configs/${id}`;
  }
}
