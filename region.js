
// To do list
// ----------
//  - draw the path of a region to a given canvas context
//  - test membership of a point in the region


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

export class Region {

    constructor ( startNode, endNode ) {
        this.start = startNode
        this.end = endNode
        this.editor = startNode
        while ( this.editor && !this.editor.classList.contains( 'ql-editor' ) )
            this.editor = this.editor.parentNode
        if ( !this.editor )
            throw new Error( 'Region endpoints must be in a ql-editor' )
        const context = this.editor.parentNode.getBoundingClientRect()
        const top = context.top
        const left = context.left
        const rect1 = startNode.getBoundingClientRect()
        const rect2 = endNode.getBoundingClientRect()
        this.isRect = rect2.top < rect1.bottom
        this.top = Math.min( rect1.top, rect2.top ) - top
        this.bottom = Math.min( rect1.bottom, rect2.bottom ) - top
        this.left = rect1.left - left
        this.right = rect2.right - left
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

    tracePath ( context ) {
        const radius = 15
        context.beginPath()
        context.moveTo( this.left + radius, this.top )
        context.lineTo( this.left, this.top )
        context.lineTo( this.left, this.top + radius)
        context.moveTo( this.right - radius, this.bottom )
        context.lineTo( this.right, this.bottom )
        context.lineTo( this.right, this.bottom - radius)
    }

}
