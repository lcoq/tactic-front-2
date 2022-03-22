import { Model, belongsTo, hasMany } from 'miragejs';

export default Model.extend({
  user: belongsTo(),
  notifications: hasMany('user-notification'),
});
