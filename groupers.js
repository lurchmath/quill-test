
// Assumes you've already pulled in Quill from its CDN

const Module = Quill.import( 'core/module' )
import { GrouperBlot, grouperHTML } from './grouper-blot.js'
import { Group } from './group.js'

// const debugBlot = blot => [
//     `${blot.constructor.blotName} ${blot.text || ''} ${blot.constructor.value ? JSON.stringify(blot.constructor.value(blot.domNode)) : ''}`,
//     ...( blot.children ? blot.children.map( debugBlot ) : [ ] )
// ]
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

// Partially imitating the example here:
// https://github.com/jspaine/quill-placeholder-module/blob/master/src/placeholder-module.ts#L22
class Groupers extends Module {

    constructor ( quill, options ) {
        super( quill, options )
        this.quill = quill

        addToolbarButton( this.quill, `<nobr>${grouperHTML(-1)}${grouperHTML(1)}</nobr>`,
            _ => this.wrapSelection() )

        addToolbarButton( this.quill, 'Debug', _ => {
            this.allGroups().forEach( ( g, i ) => {
                console.log( `${i}. ${g}` )
                console.log( `\t^  ${g.parent()}` )
                console.log( `\t<  ${g.previous()}` )
                console.log( `\t>  ${g.next()}` )
                console.log( `\tv  ${g.firstChild()}` )
                console.log( `\tvv ${g.children()}` )
                console.log( `\t[] ${g.region()}` )
            } )
        } )

        // // Debugging spam for during development and testing
        // this.quill.on( 'text-change', ( change, original, source ) => {
        //     console.log( 'from this doc: ' + JSON.stringify( original, null, 2 ) )
        //     console.log( source + ' applied this delta: ' + JSON.stringify( change, null, 2 ) )
        // } )

        this.overlay = quill.getModule( 'overlay' )
        this.overlay.draw = context => this.drawGroups( context )
        this.lastMousePos = null
        this.quill.container.addEventListener( 'mousemove', event =>
            this.lastMousePos = event )
    }

    allGroupers () { return this.quill.scroll.descendants( GrouperBlot ) }
    groupersSatisfying ( predicate ) { // predicate maps grouper, index pair to bool
        return this.allGroupers().filter(
            g => predicate( g, this.quill.getIndex( g ) ) )
    }

    allGroups () {
        return this.groupersSatisfying( g => g.isOpen() ).map( g => new Group( g ) )
    }

    pairWithId ( id ) { return this.allGroupers().filter( g => g.id() == id ) }

    indicesOpenAt ( index ) {
        const result = [ ]
        for ( let grouper of this.allGroupers() ) {
            if ( this.quill.getIndex( grouper ) >= index ) break
            if ( grouper.isOpen() )
                result.push( grouper.id() )
            else
                result.pop()
        }
        return result
    }

    nextAvailableId () {
        const usedIds = this.allGroupers().map( b => b.id() )
        let possibleAnswer = 1
        while ( usedIds.includes( possibleAnswer ) ) possibleAnswer++
        return possibleAnswer
    }

    wrapSelection () {
        const selection = this.quill.getSelection()
        if ( !selection ) return
        const start = selection.index
        const length = selection.length
        if ( `${this.indicesOpenAt(start)}` != `${this.indicesOpenAt(start+length)}` ) return
        const id = this.nextAvailableId()
        // More info on next two lines: https://quilljs.com/docs/api/#insertembed
        this.quill.insertEmbed( start, 'grouper', { id : -id }, Quill.sources.USER )
        this.quill.insertEmbed( start + 1 + length, 'grouper', { id : id }, Quill.sources.USER )
        this.quill.setSelection( start + 1, length )
    }

    groupWithId ( id ) {
        const groupers = this.pairWithId( id )
        if ( groupers.length > 0 )
            return new Group( ...groupers )
    }

    // what is the innermost group containing this index?
    // (i.e., the one for the most recent open grouper before this index)
    groupAroundIndex ( index ) {
        const openIndices = this.indicesOpenAt( index )
        if ( openIndices.length > 0 )
            return this.groupWithId( openIndices[openIndices.length - 1] )
    }
    // what is the outermost group before this index?
    // (i.e., the one for the most recent close grouper before this index)
    groupBeforeIndex ( index ) {
        const closes = this.groupersSatisfying(
            ( g, i ) => g.isClose() && i < index )
        if ( closes.length > 0 )
            return closes[closes.length - 1].group()
    }
    // what is the outermost group at or after this index?
    // (i.e., the one for the next open grouper at or after this index)
    groupAtOrAfterIndex ( index ) {
        const opens = this.groupersSatisfying(
            ( g, i ) => g.isOpen() && i >= index )
        if ( opens.length > 0 )
            return opens[0].group()
    }

    drawGroups ( context ) {
        const offset = this.quill.container.getBoundingClientRect()
        const mouseX = this.lastMousePos ? this.lastMousePos.clientX - offset.left : -1
        const mouseY = this.lastMousePos ? this.lastMousePos.clientY - offset.top : -1
        const selection = this.quill.getSelection()
        const innerGroup = selection ? this.groupAroundIndex( selection.index ) : null
        this.allGroups().forEach( group => {
            const region = group.region()
            if ( region.contains( mouseX, mouseY ) ) {
                region.drawCorners( context )
                context.fillStyle = '#ff0000'
                context.fill()
            }
            if ( innerGroup && innerGroup.equals( group ) ) {
                region.drawPath( context )
                context.strokeStyle = '#ff0000'
                context.stroke()
            }
        } )
    }

}

Quill.register( 'modules/groupers', Groupers )
