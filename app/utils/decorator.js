function getFromPath(path, context) {
  return path.split('.').reduce((current, key) => current?.[key], context);
}

function setToPath(path, key, value, context) {
  const target = getFromPath(path, context);
  target[key] = value;
}

function delegateTo(targetPath) {
  return function (_target, key) {
    return {
      get() {
        const target = getFromPath(targetPath, this);
        return target[key];
      },
      set(value) {
        setToPath(targetPath, key, value, this);
      },
    };
  };
}

export { delegateTo };
