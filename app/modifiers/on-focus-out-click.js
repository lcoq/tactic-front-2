import { modifier } from 'ember-modifier';

export default modifier(function onFocusOutClick(
  element,
  [callback, condition] /*named*/
) {
  function clickElement(event) {
    if (condition && document.body.contains(event.target) && !element.contains(event.target)) {
      callback();
    }
  }
  window.addEventListener('click', clickElement);
  return () => window.removeEventListener('click', clickElement);
});
