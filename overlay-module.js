
// Assumes you've already pulled in Quill from its CDN
const Module = Quill.import( 'core/module' )

/**
 * Most of Quill's functionality arises by adding modules to a basic Quill
 * instance.  Thus developers who want to extend Quill are encouraged to do so
 * through modules.  We build this module to add to Quill the concept of
 * an "overlay," which is a transparent canvas that sits on top of the editor
 * and has the same dimensions as the editor, so that one can draw on top of it
 * and it will appear to be adding visual content to the editor.  For instance,
 * one may use this to overlay highlights, feedback on editor content, tooltips,
 * etc.
 */
class OverlayModule extends Module {

    /**
     * Construct an instance of this module for the given editor.  It creates
     * the canvas instance, positions it, and installs event handlers so that it
     * redraws itself whenever important aspects of the editor and/or its
     * contents change.
     * 
     * @param {Quill} quill - a Quill editor instance
     * @param {Object} options - an options object with which the editor was set up
     */
    constructor ( quill, options ) {
        // call super and store the editor instance
        super( quill, options )
        this.quill = quill

        // create canvas and place into DOM hierarchy
        this.canvas = quill.container.ownerDocument.createElement( 'canvas' )
        this.canvas.style.pointerEvents = 'none'
        quill.container.parentNode.insertBefore(
            this.canvas, quill.container.nextSibling )
        this.canvas.style.position = 'absolute'

        // create an internal EventTarget instance for draw event emitting
        this.eventTarget = new EventTarget()

        // install event handlers so that the overlay redraws when editor
        // contents, selection, mouse position, or scrollbar changes
        const updateSize = () => this.updateSize()
        const updatePict = () => this.redraw()
        updateSize()
        new ResizeObserver( updateSize ).observe( quill.container )
        quill.on( 'text-change', () => setTimeout( updatePict, 0 ) )
        quill.on( 'selection-change', updatePict )
        this.quill.container.addEventListener( 'mousemove', updatePict )
        this.quill.scroll.domNode.addEventListener( 'scroll', updatePict )
    }

    /**
     * We cannot make the overlay module an `EventTarget` because JavaScript
     * does not support multiple inheritance, and it must be a Quill `Module`.
     * Thus we have an internal `EventTarget` instance, and expose its API by
     * passing calls to this function through into that internal object.
     * 
     * You can use this to install `'draw'` event handlers on this object, and
     * such event handlers will receive a `'draw'` event as parameter when they
     * are called.  That event will have a `context` member, which will be the
     * canvas context on which to draw.  You can then call `context.canvas` to
     * get the canvas instance, if you need it.
     * 
     * @param  {...any} args - an event type and handler, plus the optional
     *   `useCapture` boolean or `options` object, as usual for
     *   `addEventListeners()`
     */
    addEventListener ( ...args ) {
        this.eventTarget.addEventListener( ...args )
    }

    /**
     * Also part of the passthrough API for the inner EventTarget; see
     * `addEventListener()` for details.  The parameters are the same.
     */
    removeEventListener ( ...args ) {
        this.eventTarget.removeEventListener( ...args )
    }

    /**
     * Used internally to resize and reposition the overlay canvas to match the
     * size and position of the editor it covers.  It then calls `redraw()`; see
     * its documentation for details.
     */
    updateSize () {
        this.canvas.style.top = this.quill.container.offsetTop + 'px'
        this.canvas.style.left = this.quill.container.offsetLeft + 'px'
        this.canvas.style.width = this.quill.container.offsetWidth + 'px'
        this.canvas.style.height = this.quill.container.offsetHeight + 'px'
        this.canvas.width = this.quill.container.offsetWidth
        this.canvas.height = this.quill.container.offsetHeight
        this.redraw()
    }

    /**
     * Clear the canvas and emit a `'draw'` event, so that any installed
     * handlers can redraw the contents of the canvas.  This gets called
     * whenever the editor contents, position, selection, scrollbars, etc.
     * change, so that if the overlay's drawing needs to change, it can respond
     * appropriately.
     */
    redraw () {
        const drawEvent = new Event( 'draw' )
        drawEvent.context = this.canvas.getContext( '2d' )
        drawEvent.context.clearRect( 0, 0, this.canvas.width, this.canvas.height )
        this.eventTarget.dispatchEvent( drawEvent )
    }
    
}

Quill.register( 'modules/overlay', OverlayModule )
