
# General

Later we will need a nice UI with menus, submenus, keyboard shortcuts, etc.

# New development

 1. Create a tooltip class with the following features.
     * At construction time, you give it the element over which it will float.
     * It constructs a DIV and lets you fill it with whatever HTML you want.
     * This may include input widgets, which should be interactive.
     * At any time, you can ask it to position itself relative to a certain
       point, above/below/left/right of that point.
     * It has built-in support for adding arrows in any of the 8 corners to
       point to things in the element below, so it looks like a tooltip.  It
       should also have border features.
     * At any time, you can ask it to go away.
     * You can tell it which descendant of the float-over element it's supposed
       to be the tooltip for, and it will seek to always reposition itself
       strategically above/below/near that element, whenever changes happen.
       You can specify a preferred location (e.g., preferred above, f.ex.) for
       when many options exist.
 1. Use the tooltip class to make it possible to put a tooltip on a group.
 1. Create a new Quill module that uses tooltips for editing read-only, inline,
    atomic embeds.  Try to imitate Notion's very nice feature set.  General
    idea:
     * Provide a function that converts an embed into the UI for editing it,
       populated with the current state of that embed.  Call this once, when you
       start editing the embed, to generate the tooltip contents.
     * Provide a function that converts the UI for editing the embed into the
       new state of the embed.  Call this whenever the tooltip editor changes.
 1. Can we make a better version of the formula editor or MathQuill4Quill one?

# Notes for later, from discussion with Ken

 * We will eventually want menu items for inserting common mathematical
   structures,such as theorem, proof, etc.
 * We will eventually want autocomplete in at least two ways:
    * `\alpha` becomes ⍺, etc.
    * Theorem becomes the structure you would insert through the menu item
 * We are in the process of deciding how to handle meaningless math, if at all.
 * Because parsing is not at all the slow part of the LDE, the UI can provide
   just a text or JSON representation of the document, and the LDE can just
   batch process the whole thing.
 * We will eventually want to assign unique IDs to each piece of input, so that
   feedback can be traced back to what it should be attached to in the UI, but
   that doesn't have to appear in the earliest prototypes.
 * For groups that contain a set of consecutive, entire paragraphs, consider the
   subtle UI that VS Code Markdown Preview users (thick grey line, left gutter).
 * We are agreed that groupers should be invisible by default, but that later
   each group should be able to customize how its groupers appear.
