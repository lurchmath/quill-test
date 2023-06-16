
// Assumes you've already pulled in Quill from its CDN

const Embed = Quill.import( 'blots/embed' )
import { Group } from './group.js'

const appendHTML = ( node, html ) => {
    const wrapper = node.ownerDocument.createElement( 'span' )
    wrapper.classList.add( 'suffix-wrapper' )
    wrapper.innerHTML = html
    node.appendChild( wrapper )
}
const changeSuffix = ( node, html ) => {
    const suffixes = node.getElementsByClassName( 'suffix-wrapper' )
    if ( suffixes.length == 0 ) return
    suffixes[0].innerHTML = html
}

// Partially imitating the example here:
// https://github.com/jspaine/quill-placeholder-module/blob/master/src/placeholder-blot.ts#L9
export class Grouper extends Embed {

    static blotName = 'grouper'
    static tagName = 'span'
    static idToHtml = id =>
        `<span style="color:white; background:#00a6ed; padding:3px;">${id<0?'[':']'}<sub>${Math.abs(id)}</sub></span>`

    // value is of the form { id : integer } (-3 for left grouper, +3 for corresponding right grouper)
    static create ( value ) {
        const node = super.create( value )
        node.setAttribute( 'data-id', value.id )
        if ( Grouper.idToHtml )
            appendHTML( node, Grouper.idToHtml( value.id ) )
        return node
    }
    setHTML ( html ) { changeSuffix( this.domNode, html ) }
    static value ( element ) { return element.dataset }
    data () { return Grouper.value( this.domNode ) }
    
    constructor ( node, value ) {
        super( node, value )
        this.id = value.id
    }
    
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
    isOpen () { return this.id < 0 }
    isClose () { return !this.isOpen() }
    getOpen () { return this.isOpen() ? this : this.partner() }
    getClose () { return this.isOpen() ? this.partner() : this }
    
    length () { return 1 }
    deleteAt ( index, length ) {
        if ( this.beingDeleted ) return
        this.beingDeleted = true
        const partner = this.partner() // in case deleting this would mess up computing the partner...
        super.deleteAt( index, length ) // ...we chose to do that first.
        if ( partner ) partner.deleteAt( 0, 1 )
    }

    group () { return new Group( this ) }

}

Quill.register( Grouper )
