
// A module for storing utility functions useful when developing with Quill.

export const getToolbarGroup = quill => {
    const toolbar = quill.getModule( 'toolbar' ).container
    const found = toolbar.getElementsByClassName( 'groupers-tools' )
    if ( found.length > 0 ) return found[0]
    const result = toolbar.ownerDocument.createElement( 'span' )
    result.classList.add( 'groupers-tools' )
    result.classList.add( 'ql-formats' )
    toolbar.appendChild( result )
    return result
}

export const addToolbarButton = ( quill, html, handler ) => {
    const zone = getToolbarGroup( quill )
    const button = zone.ownerDocument.createElement( 'button' )
    button.innerHTML = html
    button.addEventListener( 'click', handler )
    zone.appendChild( button )
}

// This does not match perfectly with the existing Quill style, but it functions:
export const addToolbarMenu = ( quill, list, handler ) => {
    const zone = getToolbarGroup( quill )
    const select = zone.ownerDocument.createElement( 'select' )
    select.innerHTML = list.map( x => `<option value="${x}">${x}</option>` ).join( '' )
    select.addEventListener( 'change', handler ) // event.target will be the select
    zone.appendChild( select )
}

// set this up with quill.on('text-change',debugTextChange) for lots of console
// spam about every single edit to the document
export const debugTextChange = ( change, original, source ) => {
    console.log( 'from this doc: ' + JSON.stringify( original, null, 2 ) )
    console.log( source + ' applied this delta: ' + JSON.stringify( change, null, 2 ) )
}
