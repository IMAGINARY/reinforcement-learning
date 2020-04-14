import Vue from 'vue';

Vue.component('editor-palette', {
  props: ["tile_types", "current_type", "enabled"],
  template: `
  <div class="editor-palette">
    <button v-on:click="$emit('switch-editor')">Map Editor</button> <button v-if="enabled" v-on:click="$emit('clear-maze')">Clear All</button>
    <div v-if="enabled" v-for="(desc, type) in tile_types" >
      <div
        class="tile-type-button"
        v-bind:class="{ 'palette-selected': (current_type == type) }"
        v-on:click="$emit('set-tile-type', type)">
          <div class="editor-palette-sample" :class="'palette_' + type"></div>
          {{ desc }}
      </div>
    </div>
    
  </div>`,
});
