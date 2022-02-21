import { modifier } from 'ember-modifier';

export default modifier(function focusIf(element, [condition] /*, named*/) {
  if (condition) element.focus();
});
