export const dropLeadingInfo = (str: string) => {
  // remove everything before (and including) the first space
  return str.replace(/^\S+\s+/g, '');
}

export const dropTrailingInfo = (str: string) => {
  // remove everything after the ' #' characters
  return str.replace(/\s+#\S+$/g, '');
}
