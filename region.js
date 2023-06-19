
import { ScreenRect } from './screen-rect.js'
import { ScreenPoint } from './screen-point.js'

// Number of pixels by which two text lines can slightly overlap and still be
// considered different lines of text.  We will probably later need a much
// smarter way to test if two nodes are on different lines in the editor.
const epsilon = 3

/**
 * A region is an on-screen shape that includes two DOM Nodes, a start and an
 * end, which must appear in that order in the document.  If the two nodes are
 * on the same line of text on screen, then the region is a rectangle, the
 * bounding box of the union of the two nodes' bounding boxes.  If the two nodes
 * are not on the same line of text, then the region is shaped like an irregular
 * octagon that covers all text, in order, from the start node to the end node,
 * as if highlighted, as illustrated below.
 * 
 * ```
 *                                            +----------------------------+
 *     words before words before words before | words inside words inside  |
 * +------------------------------------------+                            |
 * | words inside words inside words inside words inside words inside      |
 * |                                                                       |
 * | words inside words inside words inside words inside words inside      |
 * |                                                                       |
 * | words inside words inside words inside words inside words inside      |
 * |              +--------------------------------------------------------+
 * | words inside | words after words after words after words after
 * +--------------+
 * ```
 * 
 * For convenience in discussion below, let us number these points 0 through 7.
 * The left of the two points in the topmost row (just above and to the right
 * of the text "words before words before") will be point 0, then we proceed
 * clockwise, so that they are numbered like so in all:
 * ```
 *        0-----1
 * 6------7     |
 * |            |
 * |  3---------2
 * 5--4
 * ```
 */
export class Region {

    /**
     * Construct a new Region by giving the DOM Nodes at its start and end
     * (such as the open and close groupers if this Region represents a group,
     * as defined in the groups module) and the editor node, so that all
     * coordinates can be relativized to it for drawing purposes, and padding
     * for paragraph margins/gutters can be detected.
     * 
     * @param {Node} start - the DOM Node at the start of the Region
     * @param {Node} end - the DOM Node at the end of the Region
     * @param {Node} context - the editor or container for the document
     */
    constructor ( start, end, context ) {
        // precompute all necessary ingredients
        const rect1 = start.getBoundingClientRect()
        const rect2 = end.getBoundingClientRect()
        const bounds = context.getBoundingClientRect()
        const reference = new ScreenPoint( bounds.left, bounds.top )
        this.isRect = rect2.top < rect1.bottom - epsilon
        const min = Math.min( rect1.top, rect2.top )
        const max = Math.max( rect1.bottom, rect2.bottom )
        // we now use those ingredients to compute all the points of the region,
        // and relativize them to the DOM Node given as the context
        if ( this.isRect ) {
            // if this is a rect, store its data as a ScreenRect
            this.bounds = new ScreenRect( rect1.left, min, rect2.right, max )
                .relativeTo( reference )
        } else {
            // Irregular octagon--the interesting case:
            // bounds = the rectangle that's the bounding box of the region
            // inset1 = point 7 in the above numbering
            // inset2 = point 3 in the above numbering
            const styles = context.computedStyleMap()
            const padLeft = styles.get( 'padding-left' ).value
            const padRight = styles.get( 'padding-right' ).value
            this.bounds = new ScreenRect( bounds.left + padLeft, min,
                bounds.right - padRight, max ).relativeTo( reference )
            this.inset1 = new ScreenPoint( rect1.left, rect1.bottom )
                .relativeTo( reference )
            this.inset2 = new ScreenPoint( rect2.right, rect2.top )
                .relativeTo( reference )
            this.insetRect1 = new ScreenRect( this.bounds.topLeft, this.inset1 )
            this.insetRect2 = new ScreenRect( this.inset2, this.bounds.bottomRight )
        }
    }

    /**
     * Is the given point inside this region?  This is important for mouse
     * events, so that movements, hovers, and clicks can know which region(s)
     * they overlap, and can provide behavior or feedback associated with those
     * regions.
     * 
     * In service to code brevity, this function doesn't fuss about the
     * one-pixel boundary of the region; certain parts of it may be "inside" and
     * other parts "outside" but the boundary is low priority here.  A more
     * precise implementation could be achieved with more fiddling.
     * 
     * @param {ScreenPoint} screenPoint - the point to test for membership
     * @returns {boolean} whether the point is in the region
     */
    contains ( screenPoint ) {
        if ( this.isRect ) {
            return this.bounds.contains( screenPoint )
        } else {
            return this.bounds.contains( screenPoint )
                && !this.insetRect1.contains( screenPoint )
                && !this.insetRect2.contains( screenPoint )
        }
    }

    /**
     * On the given canvas context, begin, trace, and close a path representing
     * this region.  If this region is a rectangle, the path will be a simple
     * rectangle.  Otherwise it will be the irregular octagon shown in the
     * documentation above.
     * 
     * Note that this function neither strokes nor fills the path; the client
     * can either or both of those as they choose using whatever styles they
     * prefer; this function merely calls functions like `moveTo()` and
     * `lineTo()` so that the path is defined and can be subsequently stroked or
     * filled.
     * 
     * @param {Context2D} context - an HTMLCanvas context on which to draw
     */
    drawPath ( context ) {
        context.beginPath()
        if ( this.isRect ) {
            context.rect( this.bounds.left, this.bounds.top,
                this.bounds.width(), this.bounds.height() )
        } else {
            context.moveTo( this.inset1.x, this.bounds.top )
            context.lineTo( this.bounds.right, this.bounds.top )
            context.lineTo( this.bounds.right, this.inset2.y )
            context.lineTo( this.inset2.x, this.inset2.y )
            context.lineTo( this.inset2.x, this.bounds.bottom )
            context.lineTo( this.bounds.left, this.bounds.bottom )
            context.lineTo( this.bounds.left, this.inset1.y )
            context.lineTo( this.inset1.x, this.inset1.y )
            context.lineTo( this.inset1.x, this.bounds.top )
        }
        context.closePath()
    }

    /**
     * On the given canvas context, begin, trace, and close a path representing
     * the beginning and ending corners of the region.  The corners are drawn as
     * two triangles bracketing the region.  If the region is a rectangle, those
     * two triangles will be at its top left and bottom right corners.  If it is
     * not a rectangle, they will be at the two points numbered 0 and 4 in the
     * above numbering of the region's boundary points.
     * 
     * Like `drawPath()`, this function does not actually stroke or fill the
     * path, but just traces it so that the client can stroke/fill as desired.
     * 
     * @param {Context2D} context - an HTMLCanvas context on which to draw
     */
    drawCorners ( context, radius=10 ) {
        context.beginPath()
        let rect = this.isRect ? this.bounds : new ScreenRect(
            this.inset1.x, this.bounds.top, this.inset2.x, this.bounds.bottom )
        context.moveTo( rect.left, rect.top )
        context.lineTo( rect.left + radius, rect.top )
        context.lineTo( rect.left, rect.top + radius )
        context.moveTo( rect.right, rect.bottom )
        context.lineTo( rect.right - radius, rect.bottom )
        context.lineTo( rect.right, rect.bottom - radius )
        context.closePath()
    }

    /**
     * Simple string representation for debugging, either as a rect or as a
     * non-rect region reported as the bounding rect and two insets.
     * 
     * @returns {String} a string representation of this region
     */
    toString () {
        return this.isRect ? `RectRegion(${this.bounds})` :
            `NonRectRegion(${this.bounds};${this.inset1},${this.inset2})`
    }

}
