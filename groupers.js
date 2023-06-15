
// To do list
// ----------
// Create transparent overlay canvas on which you can draw anything
// Create generic tool for overlaying many kinds of highlighting (solid, border, corners, etc.)
// Use that tool to highlight in one way when cursor is inside
// Use that tool to highlight in another way when cursor is adjacent
// Use that tool to highlight in another way when mouse passes over
// Pop up a tooltip when highlighting


// Assumes you've already pulled in Quill from its CDN

const Parchment = Quill.import( 'parchment' ) // maybe same for Delta?
const Module = Quill.import( 'core/module' )
const Embed = Quill.import( 'blots/embed' )
const ScrollBlot = Quill.import( 'blots/scroll' )

const debugBlot = blot => [
    `${blot.constructor.blotName} ${blot.text || ''} ${blot.constructor.value ? JSON.stringify(blot.constructor.value(blot.domNode)) : ''}`,
    ...( blot.children ? blot.children.map( debugBlot ) : [ ] )
]

const grouperHTML = id =>
    `<span style="color:white; background:#00a6ed; padding:3px;">${id<0?'[':']'}<sub>${Math.abs(id)}</sub></span>`

class GrouperBlot extends Embed {
    static blotName = 'grouper'
    static tagName = 'span'
    static debug = true // governs how groupers look; see create(), below

    // value is of the form { id : integer } (-3 for left grouper, +3 for corresponding right grouper)
    static create ( value ) {
        const node = super.create( value )
        node.setAttribute( 'data-group-id', value.id )
        if ( GrouperBlot.debug ) { // obviously this is for debugging/development only; turn this off later
            const symbol = value.id < 0 ? '[' : ']'
            // node.appendChild( node.ownerDocument.createTextNode( symbol + Math.abs( value.id ) + symbol ) )
            const show = node.ownerDocument.createElement( 'span' )
            node.appendChild( show )
            show.outerHTML = grouperHTML( value.id )
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
    id () { return Math.abs( this.data().groupId ) }

    topLevelAncestor () {
        for ( let walk = this ; walk ; walk = walk.parent )
            if ( walk instanceof ScrollBlot ) return walk
    }
    partner () {
        const myId = this.id()
        const doc = this.topLevelAncestor()
        return doc.descendants( GrouperBlot ).find( g => g != this && g.id() == myId )
    }

    isOpen () { return this.data().groupId < 0 }
    isClosed () { return !this.isOpen() }
    getOpen () { return this.isOpen() ? this : this.partner() }
    getClose () { return this.isOpen() ? this.partner() : this }
    
    get groupData () { return this.getClose().domNode.dataset }
}

Quill.register( GrouperBlot )

const addToolbarButton = ( quill, html, handler ) => {
    const toolbar = quill.getModule( 'toolbar' ).container
    const button = toolbar.ownerDocument.createElement( 'button' )
    button.innerHTML = html
    const wrapper = toolbar.ownerDocument.createElement( 'span' )
    wrapper.setAttribute( 'class', 'ql-formats' )
    wrapper.appendChild( button )
    toolbar.appendChild( wrapper )
    button.addEventListener( 'click', handler )
}

class Groupers extends Module {

    constructor ( quill, options ) {
        super( quill, options )
        this.quill = quill

        addToolbarButton( this.quill, `<nobr>${grouperHTML(-1)}${grouperHTML(1)}</nobr>`,
            _ => this.wrapSelection() )
        addToolbarButton( this.quill, 'Debug', _ => {
            const selection = this.quill.getSelection()
            console.log( `Groups around index ${selection.index}: ${this.thoseOpenAt( selection.index )}` )
        } )

        this.quill.on( 'text-change', ( change, original, source ) => {
            console.log( 'from this doc: ' + JSON.stringify( original, null, 2 ) )
            console.log( source + ' applied this delta: ' + JSON.stringify( change, null, 2 ) )
        } )
    }

    all () { return this.quill.scroll.descendants( GrouperBlot ) }

    pairWithId ( id ) { return this.all().filter( g => g.id() == id ) }

    thoseOpenAt ( index ) {
        const result = [ ]
        for ( let grouper of this.all() ) {
            if ( grouper.offset( this.scroll ) >= index ) break
            if ( grouper.isOpen() )
                result.push( grouper.id() )
            else
                result.pop()
        }
        return result
    }

    nextAvailableId () {
        const usedIds = this.all().map( b => b.id() )
        let possibleAnswer = 1
        while ( usedIds.includes( possibleAnswer ) ) possibleAnswer++
        return possibleAnswer
    }

    wrapSelection () {
        const selection = this.quill.getSelection()
        if ( !selection ) return
        const start = selection.index
        const length = selection.length
        if ( `${this.thoseOpenAt(start)}` != `${this.thoseOpenAt(start+length)}` ) return
        const id = this.nextAvailableId()
        // More info on next two lines: https://quilljs.com/docs/api/#insertembed
        this.quill.insertEmbed( start, 'grouper', { id : -id }, Quill.sources.USER )
        this.quill.insertEmbed( start + 1 + length, 'grouper', { id : id }, Quill.sources.USER )
        this.quill.setSelection( start + 1, length )
    }

}

Quill.register( 'modules/groupers', Groupers )
