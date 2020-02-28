export class CallBack {
  constructor() {
    this.callback = null;
  }
  set(callback) {
    this.callback = callback;
  }
  call(...args) {
    return new Promise( resolve => {
      if (this.callback != null) {
        this.callback(...args);
      }
      resolve('call');
    });
  }
}
