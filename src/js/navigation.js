import Vue from 'vue';

Vue.component('buttonbar', {
  props: ["options", "title"],
  template: `
  <nav class="buttonbar">
    {{ title }}
    <button v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
  </nav>`
});

Vue.component('navigationbar', {
  props: ["levels"],
  template: `
  <nav class="buttonbar level-navigation">
  <button v-on:click="$emit('prev-level')">Previous</button>
    <div class="nav-circle" v-for="level in levels" v-on:click="$emit('goto-level', level)"></div>
  <button v-on:click="$emit('next-level')">Next</button>
  </nav>
  `
});