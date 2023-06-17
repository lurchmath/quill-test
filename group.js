
import { Region } from './region.js'
import { Grouper } from './grouper-blots.js'

export class Group {

    // Constructor requires a grouper because it is not possible to make
    // it more flexible than that; it needs to know which editor we're talking
    // about so it can use the appropriate Quill instance for that editor.
    // Thus it is necessary to give it at least that much information; so we
    // move the convenience constructors into the Groupers module instead.
    constructor ( grouper ) {
        this.open = grouper.getOpen()
        this.close = grouper.getClose()
        this.id = this.close.id
        this.quill = Quill.find( this.open.scroll.domNode.parentNode )
        this.module = this.quill.getModule( 'groupers' )
    }

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

    nodes ( groupers=true ) {
        return this.blots( groupers ).map( blot => blot.domNode )
    }
    textContent () {
        return this.nodes( false ).map( n => n.textContent ).join( '' )
    }
    range () {
        const result = new Range()
        result.setStart( this.open.domNode, 1 )
        result.setEnd( this.close.domNode, 0 )
        return result
    }
    fragment () { return this.range().cloneContents() }

    get ( key ) { return this.close.dataset[key] }
    set ( key, value ) { return this.close.dataset[key] = value }

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

    equals ( other ) { return this.open == other.open }

    // Returns an integer in the set {0,...,6} meaning:
    // 0 == the index represents a position before the group, not touching it
    // 1 == the index represents the position immediately before the open grouper
    // 2 == the index represents the position immediately after the open grouper
    // 3 == the index represents a position inside the group, touching neither grouper
    // 4 == the index represents the position immediately before the close grouper
    // 5 == the index represents the position immediately after the close grouper
    // 6 == the index represents a position after the group, not touching it
    relativePosition ( index ) {
        const indices = this.indices()
        return index <  indices[0]                       ? 0 :
               index == indices[0]                       ? 1 :
               index == indices[1]                       ? 2 :
               index >  indices[1] && index < indices[2] ? 3 :
               index == indices[3]                       ? 4 :
               index == indices[5]                       ? 5 : 6
    }

    parent () {
        return this.module.groupAround( this.indices().beforeOpen )
    }
    previous () {
        return this.module.groupBefore( this.indices().beforeOpen )
    }
    next () {
        return this.module.groupAtOrAfter( this.indices().afterClose )
    }
    contains ( other ) { // proper containment to arbitrary depth (antireflexive)
        const mine = this.indices()
        const theirs = other.indices()
        return mine.beforeOpen < theirs.beforeOpen
            && mine.afterClose > theirs.beforeClose
    }
    firstChild () {
        const group = this.module.groupAtOrAfter( this.indices().afterOpen )
        if ( group && this.contains( group ) )
            return group
    }
    children () { // top-level children only, not all descendants
        const result = [ ]
        let child = this.firstChild()
        while ( child ) {
            result.push( child )
            child = child.next()
            if ( child && !this.contains( child ) ) break
        }
        return result
    }

    region () { return new Region( this.open.domNode, this.close.domNode ) }

    toString () { return `Group(id=${this.id},${JSON.stringify(this.indices())})` }

}
