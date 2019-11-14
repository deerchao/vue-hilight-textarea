import Vue from 'vue';
import HilightTextArea from "./components/HilightTextArea.vue";
import RawHilightTextArea from "./components/RawHilightTextArea.vue";

const Components = {
    HilightTextArea,
    RawHilightTextArea,
};

Object.keys(Components).forEach(name => {
    Vue.component(name, Components[name]);
});

export default Components;
