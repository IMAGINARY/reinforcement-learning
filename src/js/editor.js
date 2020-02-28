import Vue from 'vue';

Vue.component('editor-palette', {
  props: ["tile_types"],
  template: `
  <div id="editor-palette" class="editor-palette">
    <button v-for="(type) in tile_types">{{ type }}</button>
  </div>`
});
