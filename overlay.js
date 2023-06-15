
// To do list
// ----------
// Create a "corners" highlight path that you can stroke/fill as needed
// Use some highlight style when the cursor is inside a group
// Use another highlight style when cursor is adjacent to the group but outside
// Use another highlight style when mouse passes over the group
// Pop up a tooltip when highlighting


// Assumes you've already pulled in Quill from its CDN

const Module = Quill.import( 'core/module' )

class Overlay extends Module {

    constructor ( quill, options ) {
        super( quill, options )
        this.quill = quill
        this.canvas = quill.container.ownerDocument.createElement( 'canvas' )
        this.canvas.style.pointerEvents = 'none'
        quill.container.parentNode.insertBefore(
            this.canvas, quill.container.nextSibling )
        this.canvas.style.position = 'absolute'
        this.updateSize()
        new ResizeObserver( () => this.updateSize() ).observe( quill.container )
        quill.on( 'text-change', () => setTimeout( () => this.redraw(), 0 ) )
        quill.on( 'selection-change', () => this.redraw() )
        this.quill.container.addEventListener( 'mousemove', () => this.redraw() )
        this.quill.scroll.domNode.addEventListener( 'scroll', () => this.redraw() )
    }

    updateSize () {
        this.canvas.style.top = this.quill.container.offsetTop + 'px'
        this.canvas.style.left = this.quill.container.offsetLeft + 'px'
        this.canvas.style.width = this.quill.container.offsetWidth + 'px'
        this.canvas.style.height = this.quill.container.offsetHeight + 'px'
        this.canvas.width = this.quill.container.offsetWidth
        this.canvas.height = this.quill.container.offsetHeight
        this.redraw()
    }

    redraw () {
        const context = this.canvas.getContext( '2d' )
        context.clearRect( 0, 0, this.canvas.width, this.canvas.height )
        this.draw( context )
    }
    
    draw ( context ) {
        // This function does nothing, as a default.
        // Here's an example of the kind of thing I did just as an experiment once:

        // const radius = 15
        // context.fillStyle = '#00a6ed'
        // context.beginPath()
        // context.arc( 0, 0, radius, 0, 2 * Math.PI )
        // context.fill()
        // context.beginPath()
        // context.arc( 0, this.canvas.height, radius, 0, 2 * Math.PI )
        // context.fill()
        // context.beginPath()
        // context.arc( this.canvas.width, 0, radius, 0, 2 * Math.PI )
        // context.fill()
        // context.beginPath()
        // context.arc( this.canvas.width, this.canvas.height, radius, 0, 2 * Math.PI )
        // context.fill()
    }

}

Quill.register( 'modules/overlay', Overlay )
