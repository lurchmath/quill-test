
// A region is an on-screen shape that includes two DOM Nodes, a start and an
// end, which must appear in that order in the document.  If the two nodes are
// on the same line of text on screen now, then the region is a rectangle, the
// bounding box of the union of the two nodes' bounding boxes.  If the two nodes
// are not on the same line of text, then the region is a box shaped like a
// sequence of rectangles that cover all text in order between the start node
// and the end node, as if highlighted by a human hand, roughly this shape:
//                                            +----------------------------+
//     words before words before words before | words inside words inside  |
// +------------------------------------------+                            |
// | words inside words inside words inside words inside words inside      |
// |                                                                       |
// | words inside words inside words inside words inside words inside      |
// |                                                                       |
// | words inside words inside words inside words inside words inside      |
// |              +--------------------------------------------------------+
// | words inside | words after words after words after words after
// +--------------+

const epsilon = 3 // how many pixels tolerance can two text lines overlap

const pointInRect = ( x, y, left, top, right, bottom ) => {
    return left <= x && x <= right && top <= y && y <= bottom
}

export class Region {

    constructor ( startNode, endNode ) {
        // store our parameters and ensure they're inside a Quill editor
        this.start = startNode
        this.end = endNode
        this.editor = startNode
        while ( this.editor && !this.editor.classList.contains( 'ql-editor' ) )
            this.editor = this.editor.parentNode
        if ( !this.editor )
            throw new Error( 'Region endpoints must be in a ql-editor' )
        // measurements come in absolute viewport measurements, but we'll need
        // to relativize them because the canvas is probably not at (0,0) in the
        // view.  So we compute a (left,top) for relativizing all measurements.
        const context = this.editor.parentNode.getBoundingClientRect()
        const top = context.top
        const left = context.left
        // get rects for start and end nodes and see if this region is a rect
        const rect1 = startNode.getBoundingClientRect()
        const rect2 = endNode.getBoundingClientRect()
        this.isRect = rect2.top < rect1.bottom - epsilon
        // compute our (left,top) and (right,bottom) points, relativized as
        // mentioned above, re: viewport vs. canvas locations
        this.left = rect1.left - left
        this.top = Math.min( rect1.top, rect2.top ) - top
        this.right = rect2.right - left
        this.bottom = Math.max( rect1.bottom, rect2.bottom ) - top
        // and in case we are not a rect, store the inset corners, too
        this.innerTop = rect1.bottom - top
        this.innerBottom = rect2.top - top
    }

    toString () {
        return `${this.isRect?"":"Non-"}Rect(`
             + `${this.left},${this.top},${this.right},${this.bottom}`
             + `;${this.minLeft()}-${this.maxRight()})`
    }

    // leftmost and rightmost x values in the editor
    minLeft () {
        const styles = this.editor.computedStyleMap()
        return this.editor.offsetLeft + styles.get( 'padding-left' ).value
    }
    maxRight () {
        const styles = this.editor.computedStyleMap()
        return this.editor.offsetLeft + this.editor.offsetWidth
             - styles.get( 'padding-right' ).value
    }

    drawPath ( context ) {
        if ( this.isRect ) {
            const width = this.right - this.left
            const height = this.bottom - this.top
            context.beginPath()
            context.rect( this.left, this.top, width, height )
            context.closePath()
        } else {
            const min = this.minLeft()
            const max = this.maxRight()
            context.beginPath()
            context.moveTo( this.left, this.top )
            context.lineTo( max, this.top )
            context.lineTo( max, this.innerBottom )
            context.lineTo( this.right, this.innerBottom )
            context.lineTo( this.right, this.bottom )
            context.lineTo( min, this.bottom )
            context.lineTo( min, this.innerTop )
            context.lineTo( this.left, this.innerTop )
            context.lineTo( this.left, this.top )
            context.closePath()
        }
    }

    drawCorners ( context, radius=10 ) {
        context.beginPath()
        context.moveTo( this.left, this.top )
        context.lineTo( this.left + radius, this.top )
        context.lineTo( this.left, this.top + radius )
        context.moveTo( this.right, this.bottom )
        context.lineTo( this.right - radius, this.bottom )
        context.lineTo( this.right, this.bottom - radius )
        context.closePath()
    }

    // x and y are given relative to the top left corner of the canvas
    // (which is the same thing as the top left corner of the ql-container)
    contains ( x, y ) {
        if ( this.isRect ) {
            return pointInRect( x, y, this.left, this.top, this.right, this.bottom )
        } else {
            const min = this.minLeft()
            const max = this.maxRight()
            return pointInRect( x, y, min, this.top, max, this.bottom )
                && !pointInRect( x, y, min, this.top, this.left-1, this.innerTop-1 )
                && !pointInRect( x, y, this.right+1, this.innerBottom+1, max, this.bottom )
        }
    }

}
