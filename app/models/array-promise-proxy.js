import ArrayProxy from '@ember/array/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';

const ArrayPromiseProxyModel = ArrayProxy.extend(PromiseProxyMixin);

export default ArrayPromiseProxyModel
