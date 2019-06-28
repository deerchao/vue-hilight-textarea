<template>
  <div
    ref="container"
    @scroll="onContainerScroll"
    class="hta-container"
    :class="hasFocus?'hta-focus':'hta-blur'"
  >
    <div ref="backdrop" class="hta-backdrop">
      <div class="hta-highlights hta-content" v-html="html"></div>
    </div>
    <textarea
      ref="input"
      v-bind="$attrs"
      v-model="input"
      @input="onTextInput"
      @scroll="onInputScroll"
      @focus="hasFocus = true"
      @blur="hasFocus = false"
      class="hta-input hta-content"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script>
import Vue from "vue";
import rt from "../utils/RangeTree";

export default Vue.extend({
  name: "HilightTextArea",
  inheritAttrs: false,
  props: {
    value: { default: "", type: String },
    //[{ start: 0, length: 5, tag: { class: "identifier" }}, ...]
    segments: {
      default: function() {
        return [];
      },
      type: Array
    },
    // {start: 0, end: 2, direction: "none"}
    selection: {
      default: function() {
        return { start: 0, end: 0, direction: "none" };
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
      input: "",
      selectionUpdateInterval: -1,
      selectedRange: { start: 0, end: 0, direction: "none" },
      hasFocus: false
    };
  },
  watch: {
    value: function(v) {
      this.input = v || "";
    },
    selection: {
      handler: function(r) {
        if (!r) return;
        r.start = +r.start;
        r.end = +r.end;
        r.direction = r.direction || "none";
        this.select(r);
      },
      deep: true
    },
    html: function() {
      var self = this;
      this.$nextTick(function() {
        self.syncScroll();
      });
    }
  },
  computed: {
    sortedSegments: function() {
      var segments = this.segments.map(x => rt.createRange(x));
      segments.sort((a, b) => rt.compareRanges(a, b));
      return segments;
    },
    segmentTree: function() {
      // used as a cache, since value changes less than selection
      var root = rt.createNode();
      rt.addRanges(root, this.sortedSegments, true);
      return root;
    },
    hilights: function() {
      var selection = this.selectedRange;
      var root = rt.cloneNode(this.segmentTree);
      rt.addRange(
        root,
        rt.createRange({
          start: selection.start,
          end: selection.end,
          tag: { class: "hta-selection" }
        })
      );
      return rt.collectRanges(root);
    },
    html: function() {
      return this.generateHtml(this.input, this.hilights);
    }
  },
  created: function() {
    this.input = this.value || "";
  },
  mounted: function() {
    var self = this;
    this.selectionUpdateInterval = setInterval(function() {
      self.updateSelection();
    }, 300);
  },
  destroyed: function() {
    if (this.selectionUpdateInterval >= 0)
      clearInterval(this.selectionUpdateInterval);
  },
  methods: {
    focus: function() {
      this.$refs.input.focus();
    },
    generateHtml: function(input, hilights) {
      if (input.length == 0) return "";
      // last '\n' makes another line in textarea, but not in div
      if (input.charAt(input.length - 1) === "\n") input = input + "\n";

      // hilights that are open right now
      var open = [];
      // html(spans and texts) to be joined
      var elements = [];
      // index of next hilight to check
      var hi = 0;
      // index of current text part
      var textStart = 0;
      var self = this;

      for (let i = 0; i < input.length; i++) {
        while (open.length) {
          let h = open[open.length - 1];
          if (h.end > i) break;
          pushTextPart(i);
          elements.push("</span>");
          open.pop();
        }

        for (; hi < hilights.length; hi++) {
          let h = hilights[hi];
          if (h.start > i) break;
          pushTextPart(i);
          elements.push("<span class='hta-highlight ");
          var cls = h.tag && h.tag.class;
          if (cls) elements.push(cls);
          elements.push("'>");
          if (h.end === h.start) {
            elements.push("</span>");
          } else {
            open.push(h);
          }
        }
      }

      pushTextPart(input.length);
      while (open.length) {
        elements.push("</span>");
        open.pop();
      }

      return elements.join("");

      function pushTextPart(index) {
        if (index <= textStart) return;
        var part = input.substring(textStart, index);
        elements.push(self.htmlEncode(part));
        textStart = index;
      }
    },
    htmlEncode: function(text) {
      var span = document.createElement("span");
      span.textContent = text;
      return span.innerHTML;
    },
    onContainerScroll: function() {
      this.$refs.container.scrollLeft = 0;
    },
    onTextInput: function() {
      this.$emit("input", this.$refs.input.value);
      if (this.autoHeight) this.fitHeight();
    },
    onInputScroll: function() {
      this.syncScroll();
    },
    syncScroll: function() {
      var self = this;
      this.$nextTick(function() {
        var s = self.$refs.input;
        var d = self.$refs.backdrop;
        d.scrollTop = s.scrollTop;
        var left = s.scrollLeft;
        if (left > 0) {
          d.style.transform = "translateX(" + -left + "px)";
        } else {
          d.style.transform = "";
        }
      });
    },
    select: function(range) {
      if (!range) return;
      var input = this.$refs.input;
      input.setSelectionRange(range.start, range.end, range.direction);
      this.selectedRange = {
        start: range.start,
        end: range.end,
        direction: range.direction
      };
      this.$nextTick(() => this.scrollToRevealSelection());
    },
    updateSelection: function() {
      var input = this.$refs.input;
      if (!input) return;
      var range = {
        start: input.selectionStart || 0,
        end: input.selectionEnd || 0,
        direction: input.selectionDirection || "none"
      };
      var selection = this.selectedRange;
      if (!this.selectionEquals(range, selection)) {
        this.$emit("select", range);
      }
    },
    selectionEquals: function(a, b) {
      if (a === b) return true;
      if (!a || !b) return false;

      return (
        a.start === b.start && a.end === b.end && a.direction === b.direction
      );
    },
    scrollToRevealSelection: function() {
      var input = this.$refs.input;
      if (!input) return;
      var backdrop = this.$refs.backdrop;
      if (!backdrop) return;
      var selection = backdrop.querySelector(".hta-selection");
      if (!selection) return;

      var st = selection.offsetTop;
      if (st >= input.scrollTop && st <= input.scrollTop + input.clientHeight)
        return;

      st = Math.max(0, Math.min(st, input.scrollHeight - input.clientHeight));
      input.scrollTop = st;
    },
    fitHeight: function() {
      var self = this;
      this.$nextTick(function() {
        var el = self.$refs.input;
        if (!el) return;
        // compute the height difference which is caused by border and outline
        var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
        var diff = outerHeight - el.clientHeight;

        // set the height to 0 in case of it has to be shrinked
        el.style.height = 0;

        // set the correct height
        // el.scrollHeight is the full height of the content, not just the visible part
        el.style.height = el.scrollHeight + diff + "px";
      });
    }
  }
});
</script>

<style>
.hta-container {
  display: inline-block;
  position: relative;
  overflow: hidden !important;
  -webkit-text-size-adjust: none !important;
}

.hta-backdrop {
  position: absolute !important;
  top: 0 !important;
  right: -99px !important;
  bottom: 0 !important;
  left: 0 !important;
  padding-right: 99px !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

.hta-highlights {
  width: auto !important;
  height: auto !important;
  border-color: transparent !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  overflow: hidden !important;
}

.hta-content {
  border: 1px solid #adb5bd;
  text-align: left;
}

.hta-highlight {
  padding: 0 !important;
  color: inherit;
  margin: 0 !important;
  border: none !important;
}

.hta-input {
  display: block !important;
  position: relative !important;
  margin: 0;
  padding: 0;
  border-radius: 0;
  font: inherit;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  color: transparent !important;
  background: none transparent !important;
  caret-color: #333;
}

.hta-selection {
  background: #ccc;
}

.hta-blur .hta-selection:empty {
  background-color: rgba(255, 0, 0, 0.5) !important;
  width: 2px;
  height: 0.8em;
  margin-left: -1px !important;
  margin-right: -1px !important;
  display: inline-block;
  vertical-align: middle;
}
</style>
