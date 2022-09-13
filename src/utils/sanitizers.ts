export const dropLeadingInfo = (str: string) => {
  // remove everything before (and including) the first space
  return str.replace(/^\S+\s+/g, '');
}
