<template>
  <div ref="container" @scroll="onContainerScroll" class="hta-container" :class="containerClasses">
    <div ref="background" class="hta-background">
      <div class="hta-highlights hta-text" v-html="html"></div>
    </div>
    <textarea
      ref="input"
      v-bind="$attrs"
      v-model="input"
      @input="onTextInput"
      @scroll="onInputScroll"
      @focus="hasFocus = true"
      @blur="hasFocus = false"
      class="hta-input hta-text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script>
import Vue from "vue";
import rt from "../utils/rangeTree";
import { selectionEquals } from "../utils/selectionHelper";

export default Vue.extend({
  name: "RawHighlightTextArea",
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
      input: "",
      backgroundJobInterval: -1,
      selectedRange: { start: 0, end: 0, direction: "forward" },
      hasFocus: false
    };
  },

  computed: {
    containerClasses: function() {
      var list = [];
      list.push(this.hasFocus ? "hta-focus" : "hta-blur");
      return list;
    },
    sortedSegments: function() {
      const segments = this.segments.map(x => rt.createRange(x));
      segments.sort((a, b) => rt.compareRanges(a, b));
      return segments;
    },
    segmentTree: function() {
      // used as a cache, since value changes less offen than selection
      const root = rt.createNode();
      rt.addRanges(root, this.sortedSegments, true);
      return root;
    },
    hilights: function() {
      const selection = this.selectedRange;
      const root = rt.cloneNode(this.segmentTree);
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
      return generateHtml(this.input, this.hilights);
    }
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
        r.direction = r.direction || "forward";
        this.select(r);
      },
      deep: true
    },
    html: function() {
      const self = this;
      this.$nextTick(function() {
        self.syncScroll();
      });
    },
    hasFocus: function(v) {
      this.$emit(v ? "focus" : "blur");
    }
  },

  methods: {
    onContainerScroll: function() {
      this.$refs.container.scrollLeft = 0;
    },
    onInputScroll: function() {
      this.syncScroll();
    },
    onTextInput: function() {
      this.$emit("input", this.$refs.input.value);
      if (this.autoHeight) this.fitHeight();
    },

    focus: function() {
      this.$refs.input.focus();
    },

    select: function(range) {
      if (!range) return;
      const input = this.$refs.input;
      input.setSelectionRange(range.start, range.end, range.direction);
      this.selectedRange = {
        start: range.start,
        end: range.end,
        direction: range.direction
      };
      this.$nextTick(() => this.scrollToRevealSelection());
    },
    scrollToRevealSelection: function() {
      const input = this.$refs.input;
      if (!input) return;
      const background = this.$refs.background;
      if (!background) return;
      const selection = background.querySelector(".hta-selection");
      if (!selection) return;

      let st = selection.offsetTop;
      if (st >= input.scrollTop && st <= input.scrollTop + input.clientHeight)
        return;

      st = Math.max(0, Math.min(st, input.scrollHeight - input.clientHeight));
      input.scrollTop = st;
    },
    updateSelection: function() {
      const input = this.$refs.input;
      if (!input) return;
      const range = {
        start: input.selectionStart || 0,
        end: input.selectionEnd || 0,
        direction: input.selectionDirection || "forward"
      };
      const selection = this.selectedRange;
      if (!selectionEquals(range, selection)) {
        this.$emit("update:selection", range);
      }
    },

    fitHeight: function() {
      const self = this;
      this.$nextTick(function() {
        const input = self.$refs.input;
        const container = self.$refs.container;
        if (!input || !container) return;

        // set the height to 0 in case of it has to be shrinked
        container.style.height = 0;
        container.style.height = input.scrollHeight + "px";

        this.syncSize();
      });
    },

    syncScroll: function() {
      const self = this;
      this.$nextTick(function() {
        const s = self.$refs.input;
        const d = self.$refs.background;
        d.scrollTop = s.scrollTop;
        const left = s.scrollLeft;
        if (left > 0) {
          d.style.transform = "translateX(" + -left + "px)";
        } else {
          d.style.transform = "";
        }
      });
    },
    syncSize: function() {
      const self = this;
      this.$nextTick(function() {
        const input = self.$refs.input;
        const container = self.$refs.container;
        const background = self.$refs.background;
        if (!input || !container || !background) return;

        if (input.clientHeight != container.clientHeight)
          input.style.height = container.clientHeight + "px";
        if (input.clientWidth != container.clientWidth)
          input.style.width = container.clientWidth + "px";
        if (background.clientHeight != container.clientHeight)
          background.style.height = container.clientHeight + "px";
        if (background.clientWidth != container.clientWidth)
          background.style.width = container.clientWidth + "px";
      });
    },
    backgroundJob: function() {
      this.syncSize();
      this.updateSelection();
    }
  },

  created: function() {
    this.input = this.value || "";
  },
  mounted: function() {
    const self = this;
    this.backgroundJobInterval = setInterval(function() {
      self.backgroundJob();
    }, 300);
  },
  destroyed: function() {
    if (this.backgroundJobInterval >= 0)
      clearInterval(this.backgroundJobInterval);
  }
});

function generateHtml(input, hilights) {
  if (input.length == 0) return "";
  // last '\n' makes another line in textarea, but not in div
  if (input.charAt(input.length - 1) === "\n") input = input + "\n";

  // hilights that are open right now
  const open = [];
  // html(spans and texts) to be joined
  const elements = [];
  // index of next hilight to check
  let hi = 0;
  // index of current text part
  let textStart = 0;

  for (let i = 0; i < input.length; i++) {
    while (open.length) {
      let h = open[open.length - 1];
      if (h.end > i) break;
      pushTextPart(i);
      elements.push("</span>");
      open.pop();
    }

    for (; hi < hilights.length; hi++) {
      const h = hilights[hi];
      if (h.start > i) break;
      pushTextPart(i);
      elements.push("<span class='hta-highlight ");
      const cls = h.tag && h.tag.class;
      if (cls) elements.push(cls);
      const ni = h.tag && h.tag.nodeIndex;
      if (typeof ni === "number") {
        elements.push(ni % 2 ? " hta-highlight-odd" : " hta-highlight-even");
      }
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
    const part = input.substring(textStart, index);
    elements.push(htmlEncode(part));
    textStart = index;
  }

  function htmlEncode(text) {
    const span = document.createElement("span");
    span.textContent = text;
    return span.innerHTML;
  }
}
</script>


<style>
.hta-container {
  display: inline-block;
  position: relative;
  overflow: hidden !important;
  text-size-adjust: none !important;
}

.hta-background {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

.hta-highlights {
  width: auto !important;
  height: auto !important;
  border-style: none !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  overflow: hidden !important;
}

.hta-text {
  text-align: left;
  font: inherit;
  margin: 0;
  padding: 0;
}

.hta-input {
  display: block !important;
  position: relative !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  color: transparent !important;
  background: none transparent !important;
  width: 100% !important;
  height: 100% !important;
  border-style: none !important;
  resize: none !important;
  outline: none !important;
  caret-color: #333;
}

.hta-highlight {
  margin: 0 !important;
  padding: 0 !important;
  border-style: none !important;
  font: inherit;
  color: inherit;
}

.hta-highlight-odd {
  background-color: #ee9;
}

.hta-highlight-even {
  background-color: #ddd;
}
</style>
