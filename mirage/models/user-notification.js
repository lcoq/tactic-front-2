import { Model, belongsTo } from 'miragejs';

export default Model.extend({
  user: belongsTo(),
  resource: belongsTo({ polymorphic: true })
});
