<template>
  <div id="app">
    <div>
      <HilightTextArea
        v-model="text"
        :selection="selection"
        @update:selection="selection = $event"
        :segments="segments"
        rows="10"
      />
    </div>

    <div>
      <label>
        Selection Start:
        <input type="number" v-model.number="selection.start" />
      </label>
      <label>
        Selection End:
        <input type="number" v-model.number="selection.end" />
      </label>
    </div>

    <div>
      <div v-for="(s, i) in segments" :key="s.start * s.end">
        <label>
          Segment {{i}} Start:
          <input type="number" v-model.number="s.start" />
        </label>
        <label>
          Segment {{i}} End:
          <input type="number" v-model.number="s.end" />
        </label>

        <button type="button" @click="removeSegment(i)">Delete</button>
      </div>
      <button type="button" @click="addSegment">Add Segment</button>
    </div>
  </div>
</template>

<script>
import HilightTextArea from "./components/HilightTextArea.vue";

export default {
  name: "app",
  components: {
    HilightTextArea
  },
  data: function() {
    return {
      text: "Hello, world",
      selection: {
        start: 0,
        end: 0,
        direction: "none"
      },
      segments: []
    };
  },
  created: function() {
    var segments = [];
    for (var i = 0; i < this.text.length; i++) {
      if (this.text.charAt(i) === "o") {
        segments.push({ start: i, end: i + 2, tag: { class: "blue" } });
      }
    }
    this.segments = segments;
  },
  methods: {
    removeSegment: function(index) {
      this.segments.splice(index, 1);
    },
    addSegment: function() {
      this.segments.push({ start: 0, end: 0, tag: { class: "blue" } });
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.blue {
  color: blue;
}
</style>
