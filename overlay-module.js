
// Assumes you've already pulled in Quill from its CDN

const Module = Quill.import( 'core/module' )

class OverlayModule extends Module {

    constructor ( quill, options ) {
        super( quill, options )
        this.quill = quill
        this.canvas = quill.container.ownerDocument.createElement( 'canvas' )
        this.canvas.style.pointerEvents = 'none'
        quill.container.parentNode.insertBefore(
            this.canvas, quill.container.nextSibling )
        this.canvas.style.position = 'absolute'
        const updateSize = () => this.updateSize()
        const updatePict = () => this.redraw()
        updateSize()
        new ResizeObserver( updateSize ).observe( quill.container )
        quill.on( 'text-change', () => setTimeout( updatePict, 0 ) )
        quill.on( 'selection-change', updatePict )
        this.quill.container.addEventListener( 'mousemove', updatePict )
        this.quill.scroll.domNode.addEventListener( 'scroll', updatePict )
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
        // pure virtual function; replace with desired behavior
    }

}

Quill.register( 'modules/overlay', OverlayModule )
