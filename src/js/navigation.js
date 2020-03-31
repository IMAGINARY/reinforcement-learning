import Vue from 'vue';

Vue.component('buttonbar', {
  props: ["options", "title"],
  template: `
  <nav class="navi">
    {{ title }}
    <button v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
  </nav>`
});
