import { modifier } from 'ember-modifier';

export default modifier(function onMouseLive(element, [callback]) {
  element.addEventListener('mouseleave', callback);
  return () => element.removeEventListener('mouseleave', callback);
});
