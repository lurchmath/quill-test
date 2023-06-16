
// Import necessary stuff
const Embed = Quill.import( 'blots/embed' )
import { Group } from './group.js'

// Two utility functions for use in this module only
// This one appends arbitrary HTML to a node, while storing it in a wrapper so
// we can change it later:
const appendHTML = ( node, html ) => {
    const wrapper = node.ownerDocument.createElement( 'span' )
    wrapper.classList.add( 'suffix-wrapper' )
    wrapper.innerHTML = html
    node.appendChild( wrapper )
}
// This one lets us change that wrapper, assuming it exists:
const changeSuffix = ( node, html ) => {
    const suffixes = node.getElementsByClassName( 'suffix-wrapper' )
    if ( suffixes.length == 0 ) return appendHTML( node, html )
    suffixes[0].innerHTML = html
}

/**
 * A grouper is one of the two endpoints of a group.  (See the Group class.)
 * They are typically invisible, but can be made to have an arbitrary HTML
 * appearance, e.g., for debugging or very obvious user feedback.
 * 
 * They are implemented as Embed instances in the Quill ecosystem, which is a
 * specific subclass of Blot (any node in a Quill document tree), specifically a
 * subclass of LeafBlot (a leaf in a Quill document tree), but a non-text
 * LeafBlot.  They are of length 1 character (like all Embeds) and are
 * uneditable.  (You cannot put your cursor inside one and start typing, even
 * when it's not invisible.)
 * 
 * Groupers provide methods for storing/retrieving data about the group, finding
 * their corresponding partner grouper, and ensuring that they are deleted iff
 * their partner is deleted.
 * 
 * The code for this class was created by imitating the following nice example.
 * https://github.com/jspaine/quill-placeholder-module/blob/master/src/placeholder-blot.ts#L9
 */
export class Grouper extends Embed {

    // We are required to store a few static values here so that Quill can
    // use our Embed subclass.
    static blotName = 'grouper'
    static tagName = 'span'

    /**
     * The idToHTML member defaults to null, meaning that groupers have no HTML
     * representation by default.  (They are invisible.)  You can make it so
     * that every grouper gets a certain representation by implementing this
     * function.  You can also change grouper appearance at runtime on a
     * case-by-case basis using setHTML(), defined below.
     * 
     * For example, you could use the following implementation instead to make
     * groupers visible:
     * ```
     * id => {
     *     const symbol = id < 0 ? '[' : ']'
     *     const style = 'color:white; background:#00a6ed; padding:3px;'
     *     const subscript = Math.abs( id )
     *     return `<span style="${style}">${symbol}<sub>${subscript}</sub></span>`
     * }
     * ```
     */
    static idToHTML = null

    /**
     * Replace the HTML representation of this grouper (which may be empty)
     * with the given HTML instead.  If there is no current HTML representation
     * for this grouper, make the given HTML the first.
     * 
     * @param {string} html - the new HTML code to use, as a string
     */
    setHTML ( html ) { changeSuffix( this.domNode, html ) }

    /**
     * Quill requires all Embed subclasses to define a static method for
     * creating the DOM node that will be inserted into the HTML document to
     * represent the Embed.  It maps a JSON data structure describing the
     * grouper to its HTML representation.  This is independent of the existence
     * of any actual instance of this class, and must behave without access to
     * any such instance.
     * 
     * The `value` parameter will have just one attribute, `id`, a nonzero
     * integer.  If negative, it is a left/open grouper; if positive, it is a
     * right/close grouper.  Two groupers whose ids have the same absolute value
     * are partners.
     * 
     * @param {Object} value - JSON data describing the grouper
     * @returns {Node} a node to be added to the DOM
     */
    static create ( value ) {
        const node = super.create( value )
        node.setAttribute( 'data-id', value.id )
        if ( Grouper.idToHTML )
            appendHTML( node, Grouper.idToHTML( value.id ) )
        return node
    }

    /**
     * This is the inverse of the `create()` function you see above.  It
     * extracts from the DOM node representing the grouper its meaning in JSON
     * form.  This may be the same as it was at creation time, unless some code
     * has altered that meaning since then.
     * 
     * This, too, is a static function that Quill requires us to provide in this
     * class.  Note that we may assume that the element passed to us is one that
     * represents a grouper.
     * 
     * @param {HTMLElement} element - the element in the DOM representing a
     *   grouper
     * @returns {Object} the JSON data structure representing a grouper
     */
    static value ( element ) { return element.dataset }

    /**
     * Quill requires Embed subclasses to have length 1, essentially treating
     * any embedded object (a video, an image, etc.) as if it were one big
     * character.  This function returns 1, to comply with that requirement.
     * 
     * @returns {integer} the integer 1, because all groupers have length 1
     */
    length () { return 1 }

    /**
     * This convenience function just applies the `value()` function you see
     * above to the DOM node for this grouper.
     * 
     * @returns {Object} the JSON data structure representing this grouper,
     *   as read from the node representing it in the DOM
     */
    data () { return Grouper.value( this.domNode ) }
    
    /**
     * We do not call `new Grouper()` ourselves, but we let Quill do so when it
     * needs to embed new groupers into the document.  It will do so after
     * having called `create()` with the JSON data representing a grouper, and
     * will provide us with both that JSON data and the DOM node created from
     * it.
     * 
     * The call to `super()` stores the node, and we need not store the value,
     * because it will change over time and should be looked up using our
     * `value()` method instead.  We take this opportunity to store the ID from
     * the value, however, which should not change throughout the life of this
     * grouper, and is convenient to not have to recompute later.
     * 
     * @param {Node} node - the node in the DOM that will represent this grouper
     * @param {Object} value - the JSON data representing this grouper
     */
    constructor ( node, value ) {
        super( node, value )
        this.id = value.id
    }

    /**
     * Groupers come in pairs, an open grouper before the group, and a close
     * grouper after it.  The open grouper's partner is the close grouper, and
     * vice versa.  This function searches the document to find this grouper's
     * partner, caches it, and returns it.  Later lookups will use the cached
     * value and thus be faster.
     * 
     * @returns {Grouper} the other grouper in the user's document that
     *   corresponds to this one
     */
    partner () {
        if ( !this._partner ) {
            const result = this.scroll.descendants( Grouper ).find( g => g.id == -this.id )
            if ( result ) {
                this._partner = result
                result._partner = this
            }
        }
        return this._partner
    }

    /**
     * Is this the open grouper in its pair?
     * 
     * @returns {boolean} whether this grouper is the open grouper in its pair
     */
    isOpen () { return this.id < 0 }

    /**
     * Is this the close grouper in its pair?
     * 
     * @returns {boolean} whether this grouper is the close grouper in its pair
     */
    isClose () { return !this.isOpen() }

    /**
     * Get the open grouper for this group, either this grouper if it is the
     * open grouper, or its partner if that one is the open grouper.
     * 
     * @returns {Grouper} the open grouper in this grouper's pair, either this
     *   grouper or its partner
     */
    getOpen () { return this.isOpen() ? this : this.partner() }

    /**
     * Get the close grouper for this group, either this grouper if it is the
     * close grouper, or its partner if that one is the close grouper.
     * 
     * @returns {Grouper} the close grouper in this grouper's pair, either this
     *   grouper or its partner
     */
    getClose () { return this.isOpen() ? this.partner() : this }
    
    /**
     * We override the default behavior of deletion for Embeds, because deleting
     * one grouper in a pair should result in the deletion of the other as well.
     * This function does exactly that, accepting its own deletion by calling
     * the `deleteAt()` method in the superclass, then also calling the same
     * method in its partner (unless of course the partner is doing that to us).
     * 
     * @param {integer} index - the index within this object to being the
     *   deletion (irrelevant in the case of Embeds)
     * @param {integer} length - the number of characters to delete (irrelevant
     *   in the case of Embeds)
     */
    deleteAt ( index, length ) {
        if ( this.beingDeleted ) return
        this.beingDeleted = true
        const partner = this.partner() // in case deleting this would mess up computing the partner...
        super.deleteAt( index, length ) // ...we chose to do that first.
        if ( partner ) partner.deleteAt( 0, 1 )
    }

    /**
     * The purpose of groupers is to delimit the boundaries in a document that
     * represent various groups of meaningful content.  The `Group` class
     * implements the groups, and this class represents merely their boundaries.
     * But you can construct a group from either of its groupers, so this is a
     * convenience function to do so.
     * 
     * @returns {Group} the group that this grouper helps delimit
     */
    group () { return new Group( this ) }

}

// We must tell Quill about this new type of document content, like so:
Quill.register( Grouper )
