

export function setButtonTimeout(element, text, timeout, onClick) {
  var timeoutRunner = null;

  const doClick = () => {
    if (timeoutRunner != null)
      clearTimeout(timeoutRunner);

    return onClick();
  };

  const refreshTimeout = (timeout) => {
    if (timeout >= 1000)
      element.innerText = text + " (" + (Math.floor(timeout/1000)) + ")";

    if (timeout <= 1000) {
      timeoutRunner = setTimeout(() => doClick(), timeout);
    } else {
      timeoutRunner = setTimeout(() => refreshTimeout(timeout - 1000), 1000);
    }
  }

  element.innerText = text;
  element.onclick = doClick;

  refreshTimeout(timeout);
}
