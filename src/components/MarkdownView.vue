<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import hljs from "highlight.js";

const props = defineProps<{ content: string }>()
const render = new marked.Renderer()

render.image = function () {
  return '<p style="color: red">图片渲染已禁用。</p>'
}

marked.setOptions({
  renderer: render,
  gfm: true,
  pedantic: false,
  async: true,
  highlight(code: string, language: string): string {
    if (!language) {
      return code
    }
    return hljs.highlight(code, { language, ignoreIllegals: true }).value
  }
})
const result = computed(() => {
  return marked(props.content)
})
</script>

<template>
  <div v-html="result" style="overflow-x: auto;overflow-y: auto"></div>
</template>