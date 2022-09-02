export default () => {
  throw new Error('fs not supported');
}

export const stat = () => {
  throw new Error('fs.stat not supported');
};

export const readFile = () => {
  throw new Error('fs.readFile not supported');
};

export const writeFile = () => {
  throw new Error('fs.writeFile not supported');
};

export const readdir = () => {
  throw new Error('fs.readdir not supported');
};

export const mkdir = () => {
  throw new Error('fs.mkdir not supported');
};
