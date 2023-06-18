
/**
 * A ScreenPoint instance represents a point on the user's screen.  We use this
 * to make it easy to extract (x,y) coordinate pairs from relevant data, and
 * translate them to be relative to a container.
 */
export class ScreenPoint {

    /**
     * Construct a ScreenPoint instance from the given data.
     * 
     * @param  {...any} args - see the `set()` function for details on accepted
     *   arguments
     */
    constructor ( ...args ) {
        this.set( ...args )
    }

    /**
     * If you call this function with an (x,y) pair of numbers, those will be
     * stored inside this object as its (x,y) coordinates.
     * 
     * If you call this function with a mouse event, its `clientX` and `clientY`
     * coordinates will be stored inside this object as its (x,y) coordinates.
     * 
     * No other types of arguments are supported at this time.
     * 
     * @param  {...any} args - (x,y) pairs or mouse events, as described above
     */
    set ( ...args ) {
        if ( args.length == 2 ) { // assume (x,y) pair
            this.x = args[0]
            this.y = args[1]
        } else if ( args.length == 1 ) { // assume mouse event
            this.x = args[0].clientX
            this.y = args[0].clientY
        } else {
            throw new Error( 'Invalid number of arguments to set()' )
        }
    }

    /**
     * A point on screen may be given in absolute coordinates (that is,
     * distances from the top left corner of the viewport) but we need to use
     * that point as distances from the top left corner of some element on
     * screen instead.  This function can help with that by relaitivizing a
     * point, that is, translating it to the new coordinate space.
     * 
     * If you provide a ScreenPoint as argument, that point will be treated as
     * the top left corner (in viewport coordinates) of the element in which
     * you'll be measuring points.  This point will subtracting that other point
     * from its internal coordinates, so that it becomes now relative to the top
     * left corner of that element.
     * 
     * If you provide an HTMLElement as argument, its top left corner (in
     * viewport coordinates) is computed, and then we proceed as above.
     * 
     * @param {any} arg - either a ScreenPoint or HTMLElement, as described
     *   above
     */
    makeRelativeTo ( arg ) {
        if ( arg instanceof ScreenPoint ) {
            this.x -= arg.x
            this.y -= arg.y
        } else if ( arg instanceof HTMLElement ) {
            const rect = arg.getBoundingClientRect()
            this.x -= rect.left
            this.y -= rect.top
        } else {
            throw new Error( `Not a ScreenPoint or HTMLElement: ${arg}` )
        }
    }

}
