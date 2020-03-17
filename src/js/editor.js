import Vue from 'vue';

Vue.component('editor-palette', {
  props: ["tile_types", "current_type"],
  template: `
  <div id="editor-palette" class="editor-palette">
    <div id="editor-current-type" :class="current_type"></div>
    <button v-for="(type) in tile_types" v-on:click="$emit('set-tile-type', type)">{{ type }}</button>
  </div>`,
});
