
# General

Later we will need a nice UI with menus, submenus, keyboard shortcuts, etc.

# `GrouperBlot`

 1. Remove `groupData()` since the only user of it is the Group itself, which
    can just access the close node's dataset directly.
 1. Replace the `quill()` function with just computing `.quill` directly in the
    constructor.
 1. Add a method for changing its HTML representation.  This way you can make
    groups visible/invisible at runtime for debugging/feedback/etc.
 1. Rename this module and the class to just `Grouper` instead of `GrouperBlot`.
 1. Document all members.

# `Group`

 1. Add methods for getting the internals of a group:
     * All leaf blots
     * All DOM nodes
     * HTML representation
     * Plain text representation
 1. Document all methods.

# `ScreenPoint`

 1. Create a `ScreenPoint` class.
 1. Constructor can take a mouse event and will extract `clientX`, `clientY`,
    or it can just take those two values.
 1. There's also a `set()` routine that can read from a mouse event.
 1. There's a `makeRelativeTo()` routine that takes a DOM Node and finds that
    node's bounding rect top left and adjusts the point to be relative to that
    (just `x -= left` and `y -= top`).  It can also just accept a point.
 1. Document all methods.

# `ScreenRect`

 1. Create a `ScreenRect` class.
 1. Constructor can take a DOM Node and will construct it from its
    `getBoundingClientRect()` instead.  Or you can pass `L,T,R,B`.
    Internally, it's two `ScreenPoint` instances.
 1. Optional second parameter to the constructor says to take padding into
    account, so you get a rect that's smaller than the bounding client rect.
 1. There's also a `set()` routine that can read from a mouse event.
 1. There's a `makeRelativeTo()` routine that just applies it to its internal
    screen points.
 1. Add a membership test for `ScreenPoint` instances.
 1. Add a clamping function for `ScreenPoint` instances.
 1. Document all methods.

# `Groupers`

 1. Rename to `GroupersModule` class in `groupers-module.js`.
 1. Move all debugging routines and the `addToolbarButton` routine to a
    `quill-dev-tools.js` file that always takes quill instances as its first
    argument.  This includes the function currently attached to the Debug button
    as well as the handler formerly attached to the text-change event.
 1. Update `drawGroups()` to use `ScreenPoint`.
 1. Document all methods.

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
