import Vue from 'vue';

Vue.component('editor-palette', {
  props: ["tile_types"],
  template: `
  <div id="editor-palette" class="editor-palette">
    <button v-for="(type) in tile_types" v-on:click="$emit('set-tile-type', type)">{{ type }}</button>
  </div>`,
});
