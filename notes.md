
# General

Later we will need a nice UI with menus, submenus, keyboard shortcuts, etc.

# `Region`

 1. Update constructor to take three rectangles as input:
     * bounding rect for start node
     * bounding rect for end node
     * bounding rect for whole editor, minus padding, for clamping purposes
    Store data internally as 1 or 3 rectangles:
     * If the thing is a rect, then it's 1 rect internally.
     * If the thing is a non-rect region, then it's 3 rects internally, one big
       one that's the region's bounding box, and two smaller ones that can be
       boolean subtracted from the first to yield the region's shape.
 1. Update the `contains()` method to take advantage of these new internals.
 1. Update `drawPath()` method to reference the appropriate coordinates.
 1. Rework all class internals to avoid `minLeft()` and `maxRight()` methods.
    Those methods can then be removed.
 1. Document all methods.

# `Overlay`

 1. Rename to `OverlayModule` class and `overlay-module.js`.
 1. Upgrade the draw method to not just be something you can override, but an
    event emitter to which you can attach handlers.
 1. Add a feature for drawing a tooltip for a group.  It should accept arbitrary
    HTML, create a DIV for it, position it on top of itself, and draw a box
    around it with a little `^` or `v` pointing to the group.
 1. Document all methods.

# New development

 1. Add a module that uses overlay's tooltips for editing read-only, inline,
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
