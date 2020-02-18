import Vue from 'vue';
import { defer } from './utils.js';

const lightBoxDef = {
  el: '#popup',
  data: {
    content: "",
    options: [],
    active: false,
  },
  methods:{
    close: function(){
      this.active = false;
    },
    popup: function(content, options){
      this.content = content;
      var answer = defer();
      var $this = this;
      this.options = options.reduce((old, opt) => {
          old[opt] = function(){
            $this.active = false;
            answer.resolve(opt);
          }
          return old
      }, {});
      this.active = true;
      return answer;
    }
  },
  template: `
  <div class="lightbox" v-bind:class="{ active: active }">{{ content }}
    <div class="options">
      <button :key="key" v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
    </div>
  </div>`
};

export var lightbox = new Vue(lightBoxDef);

/*
const PopupLibrary = {
  install(Vue, options = {}) {
    const root = 

    // Mount root Vue instance on new div element added to body
    root.$mount(document.body.appendChild(document.createElement('div')))

    lightbox = root;
  }
}
Vue.use(PopupLibrary);

*/