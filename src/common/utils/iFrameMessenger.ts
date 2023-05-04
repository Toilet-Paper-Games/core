// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function messageParent(message: any) {
  if (window.parent) {
    window.parent.postMessage(message, '*');
  } else {
    throw new Error('No parent window found');
  }
}
