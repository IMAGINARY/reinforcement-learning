import Vue from 'vue';

Vue.component('editor-palette', {
  props: ["tile_types", "current_type", "enabled"],
  template: `
  <div class="editor-palette">
    <button v-on:click="$emit('switch-editor')">Editor ON/OFF</button>
    <div v-if="enabled" id="editor-current-type" :class="current_type"></div>
    <button v-if="enabled" v-for="(type) in tile_types" v-on:click="$emit('set-tile-type', type)">{{ type }}</button>
  </div>`,
});
