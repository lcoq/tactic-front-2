import { Model, hasMany } from 'miragejs';

export default Model.extend({
  sessions: hasMany(),
});
