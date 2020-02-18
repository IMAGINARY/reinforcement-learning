import Vue from 'vue';

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
    popup: function(content, options) {
      this.content = content;
      return new Promise( (resolve) => {
        var $this = this;
        this.options = options.reduce((old, opt) => {
            old[opt] = function(){
              $this.active = false;
              resolve(opt);
            }
            return old
        }, {});
        this.active = true;
      });
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
