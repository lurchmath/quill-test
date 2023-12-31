
import { ScreenPoint } from './screen-point.js'

/**
 * A ScreenRect instance represents a rectangle on the user's screen.  We use
 * this class to store rectangles and do simple geometric utility computations
 * with them, such as testing point membership and clamping points to a
 * rectangular region.
 */
export class ScreenRect {

    /**
     * Construct a ScreenRect instance from the given data.
     * 
     * @param  {...any} args - see the `set()` function for details on accepted
     *   arguments
     */
    constructor ( ...args ) {
        this.set( ...args )
    }

    /**
     * If you call this function with an HTMLElement instance, its rectangle in
     * the viewport (currently) will be stored in this instance, queried using
     * `getBoundingClientRect()`.  The optional second parameter is whether to
     * take the element's padding into account (default false, meaning use the
     * whole rectangle, but if you set it to true, it will use only the inner
     * part, excluding the padding).
     * 
     * If you call this function with four numbers, they will be treated as
     * left, top, right, and bottom measurements, and stored in this rectangle.
     * 
     * No other types of arguments are supported at this time.
     * 
     * @param  {...any} args - HTMLElements or quadruples of numbers, as
     *   described above
     */
    set ( ...args ) {
        if ( args[0] instanceof HTMLElement ) {
            const rect = args[0].getBoundingClientRect()
            if ( args[1] ) { // did they ask us to use padding?
                const styles = args[0].computedStyleMap()
                rect.left += styles.get( 'padding-left' ).value
                rect.top += styles.get( 'padding-top' ).value
                rect.right += styles.get( 'padding-right' ).value
                rect.bottom += styles.get( 'padding-bottom' ).value
            }
            this.topLeft = new ScreenPoint( rect.left, rect.top )
            this.bottomRight = new ScreenPoint( rect.right, rect.bottom )
        } else if ( args[0] instanceof ScreenPoint ) {
            this.topLeft = args[0]
            this.bottomRight = args[1]
        } else if ( args.length == 4 ) { // assume L,T,R,B quadruple
            this.topLeft = new ScreenPoint( args[0], args[1] )
            this.bottomRight = new ScreenPoint( args[2], args[3] )
        } else {
            throw new Error( 'Invalid arguments to set()' )
        }
    }

    /**
     * Getter for the top of the rectangle (a y coordinate)
     * 
     * @returns {integer} y value of the top of the rectangle
     */
    get top () { return this.topLeft.y }

    /**
     * Getter for the bottom of the rectangle (a y coordinate)
     * 
     * @returns {integer} y value of the bottom of the rectangle
     */
    get bottom () { return this.bottomRight.y }

    /**
     * Getter for the left of the rectangle (an x coordinate)
     * 
     * @returns {integer} x value of the left of the rectangle
     */
    get left () { return this.topLeft.x }

    /**
     * Getter for the right of the rectangle (an x coordinate)
     * 
     * @returns {integer} x value of the right of the rectangle
     */
    get right () { return this.bottomRight.x }

    /**
     * Width of the rectangle in pixels
     * 
     * @returns {integer} the width of the rectangle
     */
    width () { return this.bottomRight.x - this.topLeft.x }

    /**
     * Height of the rectangle in pixels
     * 
     * @returns {integer} the height of the rectangle
     */
    height () { return this.bottomRight.y - this.topLeft.y }

    /**
     * See the documentation for `relativeTo()` in the `ScreenPoint` class.
     * A rectangle is simply two corner points, the top left and the bottom
     * right.  This function merely calls `relativeTo()` in its two corners,
     * passing the arguments along, and returning the rectangle defined by the
     * two results.
     * 
     * @param  {...any} args - passed directly to `relativeTo()` for each
     *   corner point; see above
     * @returns {ScreenRect} the new rectangle built by the subtraction
     *   described above, as a new screen rectangle (not the same instance as
     *   this one)
     */
    relativeTo ( ...args ) {
        return new ScreenRect(
            this.topLeft.relativeTo( ...args ),
            this.bottomRight.relativeTo( ...args )
        )
    }

    /**
     * Test whether the point lies inside this rectangle (inclusive of edges).
     * 
     * @param {ScreenPoint} screenPoint - the point to test for membership
     * @returns {boolean} whether the point is inside the rectangle
     */
    contains ( screenPoint ) {
        return this.topLeft.x <= screenPoint.x && screenPoint.x <= this.bottomRight.x
            && this.topLeft.y <= screenPoint.y && screenPoint.y <= this.bottomRight.y
    }

    /**
     * Clamping a point to a rectangle means finding the point inside the
     * rectangle that is closest to the given point.  We construct that point
     * and return it as a new `ScreenPoint` instance.
     * 
     * @param {ScreenPoint} screenPoint - the point to clamp to this rectangle
     * @returns {ScreenPoint} the clamped version, a different instance
     */
    clamp ( screenPoint ) {
        return new ScreenPoint(
            Math.max( this.topLeft.x, Math.min( this.bottomRight.x, screenPoint.x ) ),
            Math.max( this.topLeft.y, Math.min( this.bottomRight.y, screenPoint.y ) )
        )
    }

    /**
     * Simple string representation for debugging: [(x1,y1),(x2,y2)]
     * 
     * @returns {String} a string representation of this rectangle
     */
    toString () { return `[${this.topLeft},${this.bottomRight}]` }

}
