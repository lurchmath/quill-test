
// Assumes you've already pulled in Quill from its CDN

const Module = Quill.import( 'core/module' )
import { Grouper } from './grouper-blots.js'
import { Group } from './group.js'

const getToolbarGroup = quill => {
    const toolbar = quill.getModule( 'toolbar' ).container
    const found = toolbar.getElementsByClassName( 'groupers-tools' )
    if ( found.length > 0 ) return found[0]
    const result = toolbar.ownerDocument.createElement( 'span' )
    result.classList.add( 'groupers-tools' )
    result.classList.add( 'ql-formats' )
    toolbar.appendChild( result )
    return result
}
const addToolbarButton = ( quill, html, handler ) => {
    const zone = getToolbarGroup( quill )
    const button = zone.ownerDocument.createElement( 'button' )
    button.innerHTML = html
    button.addEventListener( 'click', handler )
    zone.appendChild( button )
}
// This does not match perfectly with the existing Quill style, but it functions:
const addToolbarMenu = ( quill, list, handler ) => {
    const zone = getToolbarGroup( quill )
    const select = zone.ownerDocument.createElement( 'select' )
    select.innerHTML = list.map( x => `<option value="${x}">${x}</option>` ).join( '' )
    select.addEventListener( 'change', handler ) // event.target will be the select
    zone.appendChild( select )
}

// Partially imitating the example here:
// https://github.com/jspaine/quill-placeholder-module/blob/master/src/placeholder-module.ts#L22
class GroupersModule extends Module {

    constructor ( quill, options ) {
        super( quill, options )
        this.quill = quill

        addToolbarButton( this.quill, `<nobr>&LeftDoubleBracket;...&RightDoubleBracket;</nobr>`,
            _ => this.wrapSelection() )

        addToolbarButton( this.quill, '&#9072;', _ => {
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

        quill.getModule( 'overlay' ).draw = context => this.drawGroups( context )
        this.lastMousePos = [ -1, -1 ]
        this.quill.container.addEventListener( 'mousemove', event =>
            this.lastMousePos = [ event.clientX, event.clientY ] )
    }

    allGroupers () { return this.quill.scroll.descendants( Grouper ) }
    findAll ( predicate ) { // predicate maps grouper, index pair to bool
        return this.allGroupers().filter(
            g => predicate( g, this.quill.getIndex( g ) ) )
    }
    find ( predicate ) {
        const all = this.allGroupers()
        for ( let i = 0 ; i < all.length ; i++ )
            if ( predicate( all[i], i ) ) return all[i]
    }
    findLast ( predicate ) {
        const all = this.allGroupers()
        let result = undefined
        for ( let i = 0 ; i < all.length ; i++ )
            if ( predicate( all[i], i ) ) result = all[i]
        return result
    }

    allGroups () {
        return this.findAll( g => g.isOpen() ).map( g => new Group( g ) )
    }

    pairWithId ( id ) { return this.findAll( g => g.id == id ) }
    groupWithId ( id ) {
        const groupers = this.pairWithId( id )
        if ( groupers.length > 0 )
            return new Group( ...groupers )
    }

    idsOpenAt ( index ) {
        const result = [ ]
        for ( let grouper of this.allGroupers() ) {
            if ( this.quill.getIndex( grouper ) >= index ) break
            if ( grouper.isOpen() )
                result.push( grouper.id )
            else
                result.pop()
        }
        return result
    }

    nextAvailableId () {
        const usedIds = this.allGroupers().map( g => g.id )
        let possibleAnswer = 1
        while ( usedIds.includes( possibleAnswer ) ) possibleAnswer++
        return possibleAnswer
    }

    wrapSelection ( source=Quill.sources.USER ) {
        const selection = this.quill.getSelection()
        if ( !selection ) return
        const start = selection.index
        const length = selection.length
        if ( `${this.idsOpenAt(start)}` != `${this.idsOpenAt(start+length)}` ) return
        const id = this.nextAvailableId()
        // More info on next two lines: https://quilljs.com/docs/api/#insertembed
        this.quill.insertEmbed( start, 'grouper', { id : -id }, source )
        this.quill.insertEmbed( start + 1 + length, 'grouper', { id : id }, source )
        this.quill.setSelection( start + 1, length )
    }

    // what is the innermost group containing the given index?
    // (i.e., the one for the most recent open grouper before this index)
    groupAround ( index ) {
        const openIds = this.idsOpenAt( index )
        if ( openIds.length > 0 )
            return this.groupWithId( openIds[openIds.length - 1] )
    }
    // what is the outermost group before the given index?
    // (i.e., the one for the most recent close grouper before this index)
    groupBefore ( index ) {
        const close = this.findLast( ( g, i ) => g.isClose() && i < index )
        if ( close ) return close.group()
    }
    // what is the outermost group at or after the given index?
    // (i.e., the one for the next open grouper at or after this index)
    groupAtOrAfter ( index ) {
        const open = this.find( ( g, i ) => g.isOpen() && i >= index )
        if ( open ) return open.group()
    }

    drawGroups ( context ) {
        const offset = this.quill.container.getBoundingClientRect()
        const mouse = [ this.lastMousePos[0] - offset.left,
                        this.lastMousePos[1] - offset.top ]
        const selection = this.quill.getSelection()
        const innerGroup = selection ? this.groupAround( selection.index ) : null
        this.allGroups().forEach( group => {
            const region = group.region()
            if ( region.contains( ...mouse ) ) {
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

Quill.register( 'modules/groupers', GroupersModule )