
// Assumes you've already pulled in Quill from its CDN

const Embed = Quill.import( 'blots/embed' )
import { Group } from './group.js'

// Partially imitating the example here:
// https://github.com/jspaine/quill-placeholder-module/blob/master/src/placeholder-blot.ts#L9
export class GrouperBlot extends Embed {

    constructor ( node, value ) {
        super( node, value )
        this.id = value.id
    }

    static blotName = 'grouper'
    static tagName = 'span'
    static idToHtml = id =>
        `<span style="color:white; background:#00a6ed; padding:3px;">${id<0?'[':']'}<sub>${Math.abs(id)}</sub></span>`

    // value is of the form { id : integer } (-3 for left grouper, +3 for corresponding right grouper)
    static create ( value ) {
        const node = super.create( value )
        node.setAttribute( 'data-group-id', value.id )
        if ( GrouperBlot.idToHtml ) { // so they can clear it out by assigning null
            const show = node.ownerDocument.createElement( 'span' )
            node.appendChild( show )
            show.outerHTML = GrouperBlot.idToHtml( value.id )
        } // end of debugging stuff
        return node
    }
    static value ( element ) { return element.dataset }
    length () { return 1 }

    deleteAt ( index, length ) {
        if ( this.beingDeleted ) return
        this.beingDeleted = true
        const partner = this.partner() // in case deleting this would mess up computing the partner...
        super.deleteAt( index, length ) // ...we chose to do that first.
        if ( partner ) partner.deleteAt( 0, 1 )
    }

    data () { return GrouperBlot.value( this.domNode ) }

    partner () {
        if ( !this._partner ) {
            const result = this.scroll.descendants( GrouperBlot ).find(
                g => g.id == -this.id )
            if ( result ) {
                this._partner = result
                result._partner = this
            }
        }
        return this._partner
    }
    isOpen () { return this.id < 0 }
    isClose () { return !this.isOpen() }
    getOpen () { return this.isOpen() ? this : this.partner() }
    getClose () { return this.isOpen() ? this.partner() : this }
    
    get groupData () { return this.getClose().domNode.dataset }
    get quill () { return Quill.find( this.scroll.domNode.parentNode ) }

    group () { return new Group( this ) }

}

Quill.register( GrouperBlot )
