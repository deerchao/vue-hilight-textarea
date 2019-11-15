<!-- 为 RawHighlightTextArea 添加边框 -->
<!-- 并使其占满父级元素空间 -->
<template>
  <div class="hta-border" :class="{'hta-border-focus': hasFocus}">
    <RawHighlightTextArea
      ref="input"
      v-bind="$attrs"
      :value="value"
      :segments="segments"
      :selection="selection"
      :autoHeight="autoHeight"
      @input="$emit('input', $event)"
      @focus="onFocus"
      @blur="onBlur"
      @update:selection="$emit('update:selection', $event)"
    ></RawHighlightTextArea>
  </div>
</template>

<script>
import Vue from "vue";
import RawHighlightTextArea from "./RawHilightTextArea.vue";

export default Vue.extend({
  name: "HighlightTextArea",
  inheritAttrs: false,

  components: { RawHighlightTextArea: RawHighlightTextArea },

  props: {
    value: { default: "", type: String },
    //[{ start: 0, length: 5, tag: { class: "identifier" }}, ...]
    segments: {
      default: function() {
        return [];
      },
      type: Array
    },
    // {start: 0, end: 2, direction: "forward"}
    selection: {
      default: function() {
        return { start: 0, end: 0, direction: "forward" };
      },
      type: Object
    },
    autoHeight: {
      default: false,
      type: Boolean
    }
  },
  data: function() {
    return {
      hasFocus: false
    };
  },
  methods: {
    onFocus: function() {
      this.hasFocus = true;
      this.$emit("focus");
    },
    onBlur: function() {
      this.hasFocus = false;
      this.$emit("blur");
    },
    focus: function() {
      this.$refs.input.focus();
    }
  }
});
</script>

<style>
.hta-border {
  padding: 3px;
  border: solid 1px #a9a9a9;
  border-radius: 3px;
  display: flex;
}

.hta-border-focus {
  border-color: #90bafe;
}

.hta-border .hta-container {
  flex: 1 1 auto;
}
</style>
