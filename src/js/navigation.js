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
  props: ["levels", "currentlevel"],
  template: `
  <nav class="buttonbar">
  <button class="nav-button" v-on:click="$emit('prev-level')">&lt;&lt;</button>
    <div v-bind:class="{ 'nav-current-level': (currentlevel == level) }" class="nav-circle" v-for="level in levels" v-on:click="$emit('goto-level', level)"></div>
  <button class="nav-button" v-on:click="$emit('next-level')">&gt;&gt;</button>
  </nav>
  `
});