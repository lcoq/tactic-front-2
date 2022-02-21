import { modifier } from 'ember-modifier';

function selectElement(event) {
  event.currentTarget.select();
}

export default modifier(function selectOnFocus(
  element /*, positional, named*/
) {
  element.addEventListener('focusin', selectElement);
  return () => element.removeEventListener('focusin', selectElement);
});
