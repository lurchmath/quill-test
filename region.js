
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
 */

import { ScreenRect } from './screen-rect.js'
import { ScreenPoint } from './screen-point.js'

const epsilon = 3 // how many pixels tolerance can two text lines overlap

export class Region {

    constructor ( start, end, context ) {
        // get rects for start and end nodes and see if this region is a rect
        const rect1 = start.getBoundingClientRect()
        const rect2 = end.getBoundingClientRect()
        const bounds = context.getBoundingClientRect()
        const reference = new ScreenPoint( bounds.left, bounds.top )
        this.isRect = rect2.top < rect1.bottom - epsilon
        const min = Math.min( rect1.top, rect2.top )
        const max = Math.max( rect1.bottom, rect2.bottom )
        // if this is a rect, store its data the easy way
        if ( this.isRect ) {
            this.bounds = new ScreenRect( rect1.left, min, rect2.right, max )
                .relativeTo( reference )
        } else { // otherwise it's an irregular octagon; this is the hard way
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

    toString () {
        return this.isRect ? `RectRegion(${this.bounds})` :
            `NonRectRegion(${this.bounds};${this.inset1},${this.inset2})`
    }

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

    // x and y are given relative to the top left corner of the canvas
    // (which is the same thing as the top left corner of the ql-container)
    contains ( screenPoint ) {
        if ( this.isRect ) {
            return this.bounds.contains( screenPoint )
        } else {
            return this.bounds.contains( screenPoint )
                && !this.insetRect1.contains( screenPoint )
                && !this.insetRect2.contains( screenPoint )
        }
    }

}
