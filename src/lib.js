import Vue from 'vue';
import HilightTextArea from "./components/HilightTextArea.vue";

const Components = {
    HilightTextArea,
};

Object.keys(Components).forEach(name => {
    Vue.component(name, Components[name]);
});

export default Components;
