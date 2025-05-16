---

# This is a title slide

## Your name here

<!--
This only appears as a speaker note.
-->

---

# Section title slide

---

# Title & body slide

This is the slide body.

Text can be styled for:

* *emphasis*
* **strong emphasis**
* ~~strikethrough~~
* `fixed width code fonts`

Slides :heart: [links](https://developers.google.com/slides) too!

---

# Section title & body slide

## This is a subtitle

This is the body

---

# This is the main point {.big}

---

# 100% {.big}

This is the body

---

# Two column layout

This is the *left* column

{.column}

This is the *right* column

---

# Slides can have videos

@[youtube](QBcHT0XJRP8)


---
# Slides can have code

```javascript
// Print hello
function hello() {
  console.log('Hello world');
}
```

---
# Code can be big...

```javascript {style="font-size: 36pt"}
// Print hello
function hello() {
  console.log('Hello big world');
}
```

---
# ... or small

```javascript {style="font-size: 8pt}
// Print hello
function hello() {
  console.log('Hello little world');
}
```

---
# Slides can have tables

Animal | Number
-------|--------
Fish   | 142 million
Cats   | 88 million
Dogs   | 75 million
Birds  | 16 million

---
# Some inline HTML and CSS is supported

Use <span style="color:red">span</span> to color text.

Use <sup>superscript</sup> and <sub>subscript</sub>, <span style="text-decoration: line-through">strikethrough</span>
or <span style="text-decoration: underline">underline</span>, even <span style="font-variant: small-caps">small <span style="color:green">caps</span>.</span>

---
{layout="Title and body"}

# Slides can use custom master slides

Custom master slides can be selected by adding the attribute `{layout="Title and body"}`, rather than auto detect the layout 
the slide layout will be chosen from the available master slides by the name.

This can be used with the flag `--copy=[presentation id]` to copy and use an existing presentation as the source rather than a blank slide.

---
