
// To do list
// ----------
// Create a rectangular highlight path that you can stroke/fill as needed
// Create a wrapped-rectangle highlight path that you can stroke/fill as needed
// Create a "corners" highlight path that you can stroke/fill as needed
// Use some highlight style when the cursor is inside a group
// Use another highlight style when cursor is adjacent to the group but outside
// Use another highlight style when mouse passes over the group
// Pop up a tooltip when highlighting


// Assumes you've already pulled in Quill from its CDN

// const Parchment = Quill.import( 'parchment' ) // maybe same for Delta?
const Module = Quill.import( 'core/module' )
// const Embed = Quill.import( 'blots/embed' )
// const ScrollBlot = Quill.import( 'blots/scroll' )

class Overlay extends Module {

    constructor ( quill, options ) {
        super( quill, options )
        this.quill = quill
        this.canvas = quill.container.ownerDocument.createElement( 'canvas' )
        quill.container.parentNode.insertBefore( this.canvas, quill.container )
        this.canvas.style.position = 'absolute'
        this.updateSize()
        new ResizeObserver( () => this.updateSize() ).observe( quill.container )
    }

    updateSize () {
        this.canvas.style.top = this.quill.container.offsetTop + 'px'
        this.canvas.style.left = this.quill.container.offsetLeft + 'px'
        this.canvas.style.width = this.quill.container.offsetWidth + 'px'
        this.canvas.style.height = this.quill.container.offsetHeight + 'px'
        this.drawSomething()
    }
    
    drawSomething () {
        this.canvas.width = parseInt( this.canvas.style.width )
        this.canvas.height = parseInt( this.canvas.style.height )
        const ctx = this.canvas.getContext( '2d' )
        ctx.fillStyle = '#00a6ed'
        const radius = 15
        ctx.beginPath();
        ctx.arc( 0, 0, radius, 0, 2 * Math.PI );
        ctx.fill();
        ctx.beginPath();
        ctx.arc( 0, this.canvas.height, radius, 0, 2 * Math.PI );
        ctx.fill();
        ctx.beginPath();
        ctx.arc( this.canvas.width, 0, radius, 0, 2 * Math.PI );
        ctx.fill();
        ctx.beginPath();
        ctx.arc( this.canvas.width, this.canvas.height, radius, 0, 2 * Math.PI );
        ctx.fill();
    }

}

Quill.register( 'modules/overlay', Overlay )
