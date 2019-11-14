# vue-hilight-textarea

This is a component for Vue.js, features a simple `TextArea` with custom highlights. What's new in it is that you're in charge of the segmentation process, which means you can and must split text into segments and provide them to `vue-hilight-textarea`. You can specify different classes for each segment, and style these segments however you want(just don't change font sizes, spacing, or any thing that affects text layout). It also shows selection range mark while not having focus, and scrolls selection range into view upon programtic selection changes. 

In case you wonder, we're placing a transparent textarea over a div of spans to show rich formatted text, and counting on their layouts match.

You can see demo at my [online javascript RegExp tester](https://deerchao.cn/tools/wegester/) page, which is why I created this project for.

## Example

```
      <HilightTextArea
        v-model="text"
        :selection="selection"
        @update:selection="selection = $event"
        :segments="segments"
        rows="10"
      />


      data: {
        text: "Hello, World."
        selection: {
            start: 0,
            end: 0,
            direction: "none"
        },
      },
      computed: {
          segments: function() {
                // this is where you can provide all the hilighting parts, updated when text changes
                var segments = [];
                for (var i = 0; i < this.text.length; i++) {
                    if (this.text.charAt(i) === "o") {
                        segments.push({ start: i, end: i + 2, tag: { class: "blue" } });
                    }
                }
                return segments;
          }
      }


      .blue {
          color: blue
      }
```

Thanks, Will Boyd, for your excelent work on jQuery plugin [highlight-within-textarea](https://github.com/lonekorean/highlight-within-textarea).

## How to use in your project
* Just take the source code
* Clone this project, and run `npm run build-lib`, then use the files inside `dist` folder
* Or just use built `dist\hilighttextarea.umd.min.js`

## How to change styles

### Styling the editor
You can bring attributes such as `readonly`, `rows`, `cols`, `class` to the component, and they will apply to the `textarea`. If you want to change background, padding, margin, font and such, you can test it with `.hta-border`, which is the top level container.

### Styling the hilights
Sepcify `tag.class` in `segments` passed to the component, it will apply to `span`s corresponding to each segment, then style with that class in CSS.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Create Vue components to deploy
```
npm run build-lib
```

### Lints and fixes files
```
npm run lint
```
