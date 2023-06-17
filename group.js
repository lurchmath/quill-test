
import { Region } from './region.js'
import { Grouper } from './grouper-blots.js'

/**
 * A group is a contiguous section of a Quill document that has had its start
 * and end marked with special (typically invisible) atomic objects called
 * groupers.  (See grouper-blots.js.)  These can be used for anything, including
 * storing arbitrary data about that region.  Groups are always nested, never
 * overlapping like [1  [2  ]1  ]2.  Each group has a unique ID, a positive
 * integer n, and the open (left) grouper will be marked with id=-n and the
 * close (right) grouper with id=n.  Groups need not be within a paragraph, and
 * need not be nested inside the DOM hierarchy in any special way; they can
 * extend from any point in a document to any later point, crossing as many
 * HTML element boundaries as you desire, within a Quill editor.
 */
export class Group {

    // Constructor requires a grouper because it is not possible to make
    // it more flexible than that; it needs to know which editor we're talking
    // about so it can use the appropriate Quill instance for that editor.
    // Thus it is necessary to give it at least that much information; so we
    // move the convenience constructors into the Groupers module instead.
    /**
     * The constructor requires one of the two groupers that define the group,
     * because it must have some way to get access to the Quill editor instance
     * in question, and having a grouper is an easy way to guarantee that.
     * 
     * This constructor stores both the open and close groupers (regardless of
     * which of the two it is provided as its argument), the group ID, the Quill
     * instance for the editor containing those groupers, and the Groupers
     * module of that editor, so that all of those objects are available later
     * when any methods in this instance are called.
     * 
     * @param {Grouper} grouper - either the open or close grouper from the pair
     *   that defines the group
     */
    constructor ( grouper ) {
        this.open = grouper.getOpen()
        this.close = grouper.getClose()
        this.id = this.close.id
        this.quill = Quill.find( this.open.scroll.domNode.parentNode )
        this.module = this.quill.getModule( 'groupers' )
    }

    /**
     * Fetch the contents of this group, in the form of an Array of LeafBlot
     * instances (https://github.com/quilljs/parchment#blots), in the order they
     * appear in the document.  Only leaves are returned, so if this group
     * contains a paragraph or table, those structures will not be included,
     * but only their leaves (which are typically text, images, or other
     * groupers).
     * 
     * See `nodes()` to get the same result but as DOM Nodes, `textContent()` to
     * fetch it as a string, `range()` to get a selection spanning the group,
     * and `fragment()` to get a copy of the group as a DocumentFragment.
     * 
     * @param {boolean} groupers - whether to include in the result other
     *   groupers that sit properly inside this group
     * @returns {Array} all leaf blots inside this group
     */
    blots ( groupers=true ) {
        const result = [ ]
        const stop = this.quill.getIndex( this.close )
        let i = this.quill.getIndex( this.open ) + this.open.length()
        while ( i < stop ) {
            const blot = this.quill.getLeaf( i )[0]
            if ( blot == this.open || blot == this.close
              || ( result.length > 0 && blot == result[result.length-1] ) ) {
                i++
                continue
            }
            if ( groupers || !( blot instanceof Grouper ) ) result.push( blot )
            i += Math.max( 1, blot.length() )
        }
        return result
    }

    /**
     * Fetch the contents of this group, in the form of an Array of DOM Nodes,
     * in the order they appear in the document.  Only leaf nodes are returned,
     * so if this group contains a paragraph or table, those structures will not
     * be included, but only the leaves of the DOM tree (which are typically
     * Text nodes and images).
     * 
     * See `blots()` to get the same result but as LeafBlots, `textContent()` to
     * fetch it as a string, `range()` to get a selection spanning the group,
     * and `fragment()` to get a copy of the group as a DocumentFragment.
     * 
     * @returns {Array} all leaf Nodes inside this group
     */
    nodes () {
        return this.blots( false ).map( blot => blot.domNode )
    }

    /**
     * Fetch the contents of this group, in the form of a single text string.
     * This is equivalent to calling `nodes()`, converting each to its text
     * content, and concatenating the results into a single string.
     * 
     * See `nodes()` to get the same result but as DOM Nodes, `blots()` to
     * fetch it as LeafBlots, `range()` to get a selection spanning the group,
     * and `fragment()` to get a copy of the group as a DocumentFragment.
     * 
     * @returns {String} the text content of this group
     */
    textContent () {
        return this.nodes().map( n => n.textContent ).join( '' )
    }

    /**
     * Create a DOM Range object that includes exactly the contents of this
     * group, including both end groupers.
     * 
     * See `nodes()` to get the same result but as DOM Nodes, `textContent()` to
     * fetch it as a string, `blots()` to get it as LeafBlots,
     * and `fragment()` to get a copy of the group as a DocumentFragment.
     */
    range () {
        const result = new Range()
        result.setStart( this.open.domNode, 1 )
        result.setEnd( this.close.domNode, 0 )
        return result
    }

    /**
     * Fetch the DOM Nodes in this group, including the open and close groupers,
     * as an HTML DocumentFragment object.  This is not the original nodes, but
     * copies of them, copied out of the original document into a separate
     * fragment.
     * 
     * See `nodes()` to get the same result but as DOM Nodes, `textContent()` to
     * fetch it as a string, `range()` to get a selection spanning the group,
     * and `blots()` to get the result as LeafBlots.
     */
    fragment () { return this.range().cloneContents() }

    /**
     * Look up data stored in this group.  As mentioned above, groups can store
     * arbitrary data, and do so using key-value pairs.  Provide a key here to
     * look up any previously stored data.  The HTMLElement dataset of the close
     * grouper is where the data is stored, so you must use keys that are valid
     * JavaScript identifiers.
     * 
     * @param {String} key - the key of the data to be looked up, which must be
     *   a valid JavaScript identifier
     * @returns {*} the data stored under the given key, or undefined if the key
     *   is not present in the group's data
     */
    get ( key ) { return this.close.dataset[key] }

    /**
     * Store data in this group.  As mentioned above, groups can store arbitrary
     * data, and do so using key-value pairs.  Provide a key and value here to
     * write data into this group.  The HTMLElement dataset of the close grouper
     * is where the data is stored, so you must use keys that are valid
     * JavaScript identifiers.
     * 
     * @param {String} key - the key of the data to be stored, which must be a
     *   valid JavaScript identifier
     * @param {*} value - the data to store under the given key
     * @returns {*} the value stored
     */
    set ( key, value ) { return this.close.dataset[key] = value }

    /**
     * Compute all indices for this group's groupers.  Here an index means a
     * zero-based index into a Quill document, as in Quill's `getIndex()`
     * function: https://quilljs.com/docs/api/#getindex-experimental
     * 
     * The groupers have four indices: the indices before and after the open
     * and close groupers.  This function returns an object with members
     * `beforeOpen`, `afterOpen`, `beforeClose`, and `afterClose`, with those
     * four indices, each as a non-negative integer.
     * 
     * @returns {Object} the indices object defined above
     */
    indices () {
        const openIndex = this.quill.getIndex( this.open )
        const closeIndex = this.quill.getIndex( this.close )
        return {
            beforeOpen : openIndex,
            afterOpen : openIndex + 1,
            beforeClose : closeIndex,
            afterClose : closeIndex + 1
        }
    }

    /**
     * You may create multiple groups from the same pair of groupers, and this
     * class does not enforce that they all be the same object (i.e., no
     * singleton pattern).  Thus if you want to test if one instance of this
     * class represents the same group in the document as another instance, use
     * this method.
     * 
     * @param {Group} other - the group to test for equality with this one
     * @returns {boolean} whether the two groups represent the same portion of
     *   the document (tested by comparing open groupers)
     */
    equals ( other ) { return this.open == other.open }

    /**
     * Given an index into the document (in the same sense as Quill's
     * `getIndex()` function,
     * https://quilljs.com/docs/api/#getindex-experimental), we report where
     * that index falls relative to this group, by returning an integer in the
     * range 0,1,2,3,4,5,6, with the following meanings.
     * 
     * 0. the index represents a position before the group, not touching it
     * 1. the index represents the position immediately before the open grouper
     * 2. the index represents the position immediately after the open grouper
     * 3. the index represents a position inside the group, touching neither grouper
     * 4. the index represents the position immediately before the close grouper
     * 5. the index represents the position immediately after the close grouper
     * 6. the index represents a position after the group, not touching it
     *
     * @param {integer} index - the index in the Quill document to test
     * @returns {integer} a code representing the relative position of the given
     *   document index to this group, as defined above
     */
    relativePosition ( index ) {
        const indices = this.indices()
        return index <  indices[0]                       ? 0 :
               index == indices[0]                       ? 1 :
               index == indices[1]                       ? 2 :
               index >  indices[1] && index < indices[2] ? 3 :
               index == indices[3]                       ? 4 :
               index == indices[5]                       ? 5 : 6
    }

    /**
     * If this group is nested inside another, then that other is this group's
     * parent, and this function will return that other group, as an instance
     * of this class.
     * 
     * @returns {Group} the parent group, or undefined if there is not one
     */
    parent () {
        return this.module.groupAround( this.indices().beforeOpen )
    }

    /**
     * If this group is preceded by another, then that other is this group's
     * previous sibling, and this function will return that other group, as an
     * instance of this class.
     * 
     * @returns {Group} the previous sibling group, or undefined if there is not
     *   one
     */
    previous () {
        return this.module.groupBefore( this.indices().beforeOpen )
    }

    /**
     * If this group is followed by another, then that other is this group's
     * next sibling, and this function will return that other group, as an
     * instance of this class.
     * 
     * @returns {Group} the next sibling group, or undefined if there is not one
     */
    next () {
        return this.module.groupAtOrAfter( this.indices().afterClose )
    }

    /**
     * Is the given group, `other`, somewhere inside this group?  Here, "inside"
     * can mean to any level of nesting depth inside intermediate groups, but
     * does not include this group itself.  For example, `!G.contains(G)`, and
     * yet if `G.parent().parent()` exists, then
     * `G.parent().parent().contains(G)`.
     * 
     * @returns {boolean} whether this group properly contains the given one
     */
    contains ( other ) { // proper containment to arbitrary depth (antireflexive)
        const mine = this.indices()
        const theirs = other.indices()
        return mine.beforeOpen < theirs.beforeOpen
            && mine.afterClose > theirs.beforeClose
    }

    /**
     * If this group contains other groups nested inside it, then this will be
     * the first such inner group (in order of open grouper index in the
     * document).
     * 
     * @returns {Group} the first child group, or undefined if there is not one
     */
    firstChild () {
        const group = this.module.groupAtOrAfter( this.indices().afterOpen )
        if ( group && this.contains( group ) )
            return group
    }

    /**
     * If this group contains other groups nested inside it, then this will be
     * the Array of all such inner groups that are directly inside this group.
     * That is, groups nested more than one level deep are not included in the
     * result; no "grandchildren."
     * 
     * @returns {Array} the array of child groups, which may be empty
     */
    children () {
        const result = [ ]
        let child = this.firstChild()
        while ( child ) {
            result.push( child )
            child = child.next()
            if ( child && !this.contains( child ) ) break
        }
        return result
    }

    /**
     * The region on screen that spans from this group's open grouper to its
     * close grouper.  This may or may not be a rectangle; see the documentation
     * for the Region class for details.
     * 
     * @returns {Region} the region on screen this group fills
     */
    region () { return new Region( this.open.domNode, this.close.domNode ) }

    /**
     * When debugging, it's useful to be able to print out a group object with
     * some of its key properties included in an obvious way in the output.
     * This function does that job.
     * 
     * @returns {String} a simple string representation of this group
     */
    toString () { return `Group(id=${this.id},${JSON.stringify(this.indices())})` }

}
