export default function findInsertIndex(array, callback) {
  const nextObject = array.find(callback);
  const nextObjectIndex = array.indexOf(nextObject);
  return nextObjectIndex !== -1 ? nextObjectIndex : array.length;
}
