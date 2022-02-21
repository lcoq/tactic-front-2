import EmberObject from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';

const PromiseProxyObjectModel = EmberObject.extend(PromiseProxyMixin);

export default PromiseProxyObjectModel;
