(function (factory) {

    // Enable multiple loading tool

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["Q", "ExecutionContext"], factory(Q, ExecutionContext));
    } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // Node js
        var Q = require("q");
        var ExecutionContext = require("./ExecutionContext");
        module.exports = factory(Q, ExecutionContext);
    } else {
        window.Dispatcher = factory(Q, ExecutionContext)
    }

})(function($q, ExecutionContext) {


    /**
     * Base constructor for the dispatcher
     * @constructor
     */
    function Dispatcher() {
        this._callbacks = [];
        this._recovers = [];

    }


    /**
     * this method let the dispatcher register a callback function
     * that will be execute on disptach operation.
     * This method return the index position in the
     * register internal array. So you can store this
     * index when registering a callback, for use with the {@see waitFor} method
     *
     * registered callback could return a simple value or a promise
     *
     * @param callback
     * @returns {number}
     */
    Dispatcher.prototype.register =  function(/* function */ callback) {
        this._callbacks.push(callback);
        return this._callbacks.length - 1;
    };

    /**
     * This method allow to register a callback to recover {@see dispatch} failed execution
     * @param callback
     * @returns {*}
     */
    Dispatcher.prototype.waitForError = function( /* function */ callback) {
        this._recovers.push(callback);
    };

    /**
     * this method run an execution. It execute all registered callback.
     * It return a promise that resolve an array of all result of all callback
     *
     * If a callback return a promise and if this promise fail, the dispatch
     * will try to use the {@see waitForError} callbacks to recover the error
     *
     * @param payload
     * @returns {promise}
     */
    Dispatcher.prototype.run = function(/* object */ payload) {
        var self = this;
        var ec = new ExecutionContext();
        return ec.run(self._callbacks, payload)
            .catch(ec.recover(self._recovers, payload))
            .catch(function(err) {
                console.error("Run failed ",ec.id, err);
                return ec.fail(err)
            })
    };

    return Dispatcher;

});