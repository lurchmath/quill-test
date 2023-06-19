
// Assumes you've already pulled in Quill from its CDN

const Module = Quill.import( 'core/module' )
import { Grouper } from './grouper-blots.js'
import { Group } from './group.js'
import { addToolbarButton } from './quill-tools.js'
import { ScreenPoint } from './screen-point.js'

// Partially imitating the example here:
// https://github.com/jspaine/quill-placeholder-module/blob/master/src/placeholder-module.ts#L22

/**
 * Most of Quill's functionality arises by adding modules to a basic Quill
 * instance.  Thus developers who want to extend Quill are encouraged to do so
 * through modules.  We build this module to add to Quill the concept of
 * "Groups."  See the Group class defined in `group.js` for details of what a
 * group is, but this module installs that capability into Quill.
 */
class GroupsModule extends Module {

    /**
     * Construct an instance of this module for the given editor.  It installs
     * relevant toolbar buttons and does other simple setup actions.
     * 
     * @param {Quill} quill - a Quill editor instance
     * @param {Object} options - an options object with which the editor was set up
     */
    constructor ( quill, options ) {
        // call super and store the editor instance
        super( quill, options )
        this.quill = quill

        // install relevant toolbar buttons
        addToolbarButton( this.quill, `<nobr>&LeftDoubleBracket;...&RightDoubleBracket;</nobr>`,
            _ => this.wrapSelection() )
        addToolbarButton( this.quill, '&#9072;', _ =>
            this.allGroups().forEach(
                ( g, i ) => console.log( `${i}. ${g.debug()}` ) ) )

        // if the overlay module is present (which it ought to be) then tell it
        // to call our `drawGroups()` method to draw group outlines on itself
        const overlayModule = quill.getModule( 'overlay' )
        if ( overlayModule )
            overlayModule.addEventListener( 'draw',
                event => this.drawGroups( event.context ) )

        // track mouse position over the editor so that we can do `drawGroups()`
        // in such a way that we react to mouse hovers
        this.lastMousePos = new ScreenPoint( -1, -1 )
        this.quill.container.addEventListener( 'mousemove', event =>
            this.lastMousePos = new ScreenPoint( event ) )
    }

    /**
     * A grouper is one of the two (typically invisible) boundary elements for a
     * group.  See the official definition in `grouper-blots.js`.  This function
     * returns all groupers in the entire document, in the order that they
     * appear on screen.
     * 
     * @returns {Array} an array of all groupers, in the order that they appear
     *   in the editor
     */
    allGroupers () { return this.quill.scroll.descendants( Grouper ) }

    /**
     * All groups that appear in the document, collected into an array, sorted
     * in the order in which those groups first appear in the document (that is,
     * where their open groupers appear).
     * 
     * @returns {Array} an array of all groups, in the order that their open
     *   groupers appear in the editor
     */
    allGroups () {
        return this.findAll( g => g.isOpen() ).map( g => new Group( g ) )
    }

    /**
     * Find all groupers satisfying a given predicate.  This is simply a sublist
     * of the `allGroupers()` function.  The predicate receives two arguments:
     * the grouper and its index in the document (that is, the number of
     * characters from the start of the document to the start of the grouper).
     * 
     * @param {function} predicate - a function mapping (grouper,index) pairs to
     *   boolean results, a predicate on groupers
     * @returns {Array} the list of all groupers satisfying the predicate, in
     *   the same order that they appear in the document
     */
    findAll ( predicate ) { // predicate maps grouper, index pair to bool
        return this.allGroupers().filter(
            g => predicate( g, this.quill.getIndex( g ) ) )
    }

    /**
     * This is the same as `findAll()`, but it runs more quickly because it
     * returns only the first grouper found to pass the predicate, not all such
     * groupers.
     * 
     * @param {function} predicate - same as in `findAll()`
     * @returns {Grouper} the grouper found, or undefined if none was found
     */
    find ( predicate ) {
        const all = this.allGroupers()
        for ( let i = 0 ; i < all.length ; i++ )
            if ( predicate( all[i], i ) ) return all[i]
    }

    /**
     * This is the same as `find()`, but it searches from the end of the list of
     * groupers instead.
     * 
     * @param {function} predicate - same as in `find()`
     * @returns {Grouper} the grouper found, or undefined if none was found
     */
    findLast ( predicate ) {
        const all = this.allGroupers()
        for ( let i = all.length - 1 ; i >= 0 ; i-- )
            if ( predicate( all[i], i ) ) return all[i]
    }

    /**
     * Each group has a unique positive integer id.  This function returns the
     * pair of groupers (the open and close groupers) for the group with the
     * given id, or undefined if no such group currently sits in the editor.
     * 
     * @param {integer} id - a positive integer, the id for the group to find
     * @returns {Array} the two groupers in the document with the given id, as
     *   an array of length 2, or an empty array if there is no such pair
     */
    pairWithId ( id ) { return this.findAll( g => g.id == id ) }

    /**
     * Each group has a unique positive integer id.  This function returns the
     * group with the given id, or undefined if no such group currently sits in
     * the editor.
     * 
     * @param {integer} id - a positive integer, the id for the group to find
     * @returns {Group} the group in the document with the given id, or
     *   undefined if there is no such group
     */
    groupWithId ( id ) {
        const groupers = this.pairWithId( id )
        if ( groupers.length > 0 )
            return new Group( ...groupers )
    }

    /**
     * A group can be said to contain that portion of the document between its
     * open and close groupers.  Thus for a given position in the document, we
     * can ask which groups contain that position.  This function does so,
     * returning the result not as a set of groups, but as a set of their ids,
     * in the order in which the open groupers appear in the document.
     * 
     * @param {integer} index - index into the document, that is, the character
     *   position in the document about which this question is being asked
     * @returns {Array} the array of integer ids of groups that are still open
     *   at the given document position
     */
    idsContaining ( index ) {
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

    /**
     * The first group created in the document will have id 1.  The next group
     * will have id 2, assuming the first one still exists; if the first one has
     * been deleted, then the second one will take id 1 instead.  And so on,
     * each new group will have the smallest id currently available, that is,
     * not currently being used by an existing group.
     * 
     * This function looks through the document to find the smallest unused id,
     * so that it can be used for the next group to be added to the document.
     * 
     * @returns {integer} the smallest positive integer not currently being used
     *   as an id by a group in the document
     */
    nextAvailableId () {
        const usedIds = this.allGroupers().map( g => g.id )
        let possibleAnswer = 1
        while ( usedIds.includes( possibleAnswer ) ) possibleAnswer++
        return possibleAnswer
    }

    /**
     * Wrap the current editor selection in a new group by inserting a new open
     * and close grouper before and after the selection.  The selection will
     * remain the interior of the new group, which actually means taht its start
     * index will have increased by 1.
     * 
     * @param {string} source - a Quill source (e.g., `Quill.sources.USER`),
     *   meaning the source of the action that led to this edit
     */
    wrapSelection ( source=Quill.sources.USER ) {
        const selection = this.quill.getSelection()
        if ( !selection ) return
        const start = selection.index
        const length = selection.length
        if ( `${this.idsContaining(start)}` != `${this.idsContaining(start+length)}` ) return
        const id = this.nextAvailableId()
        // More info on next two lines: https://quilljs.com/docs/api/#insertembed
        this.quill.insertEmbed( start, 'grouper', { id : -id }, source )
        this.quill.insertEmbed( start + 1 + length, 'grouper', { id : id }, source )
        this.quill.setSelection( start + 1, length )
    }

    /**
     * What is the innermost group containing the given document index?
     * 
     * @param {integer} index - an index into the document (number of characters
     *   from the document start)
     * @returns {Group} the innermost group around the given index, or undefined
     *   if there is none
     */
    groupAround ( index ) {
        const openIds = this.idsContaining( index )
        if ( openIds.length > 0 )
            return this.groupWithId( openIds[openIds.length - 1] )
    }

    /**
     * What is the last group ending before the given document index?
     * 
     * @param {integer} index - an index into the document (number of characters
     *   from the document start)
     * @returns {Group} the group whose closing grouper immediately precedes the
     *   given index, or undefined if there is none
     */
    groupBefore ( index ) {
        const close = this.findLast( ( g, i ) => g.isClose() && i < index )
        if ( close ) return close.group()
    }

    /**
     * What is the first group starting after the given document index?
     * 
     * @param {integer} index - an index into the document (number of characters
     *   from the document start)
     * @returns {Group} the group whose open grouper immediately follows the
     *   given index, or undefined if there is none
     */
    groupAtOrAfter ( index ) {
        const open = this.find( ( g, i ) => g.isOpen() && i >= index )
        if ( open ) return open.group()
    }

    /**
     * Draw outlines of groups in reaction to the most recent mouse position,
     * using the given canvas context.  This is an appropriate event handler for
     * the `draw()` event of the overlay module.
     * 
     * @param {Context2D} context - an HTMLCanvas context on which to draw
     */
    drawGroups ( context ) {
        const mouse = this.lastMousePos.relativeTo( this.quill.container )
        const selection = this.quill.getSelection()
        const innerGroup = selection ? this.groupAround( selection.index ) : null
        this.allGroups().forEach( group => {
            const region = group.region()
            if ( region.contains( mouse ) ) {
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

Quill.register( 'modules/groups', GroupsModule )
