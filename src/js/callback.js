export class CallBack {
  constructor() {
    this.callback = null;
  }
  set(callback) {
    this.callback = callback;
  }
  call(...args) {
    if (this.callback != null) {
      this.callback(...args);
    }
  }
}
