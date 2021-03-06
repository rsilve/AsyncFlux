(function (factory) {

    // Enable multiple loading tool

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["Q"], factory(Q));
    } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // Node js
        var Q = require("q");
        module.exports = factory(Q);
    } else {
        // Global Browser
        window.ExecutionContext = factory(Q)
    }

})(function($q) {

    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    })();


    /**
     * Execution context is create each time dispatcher run dispatch method
     * It store the complete execution stack
     *
     * The instance is pass to the callbacks so we can manipulate the execution
     * workflow
     *
     * @constructor
     */
    function ExecutionContext() {
        this.promises = [];
        this.id = guid();
    }

    /**
     * Create the list of promise to execute from the callbacks array.
     * Promises are run concurrently and the method return the array
     * of promise result in the same order that the callbacks order
     *
     * @param callbacks
     * @param payload
     * @returns {Promise}
     */
    ExecutionContext.prototype.run = function (/* Array */ callbacks, /* object */ payload) {
        var self = this;
        var defers = [];
        this.promises = [];

        // here we defer the start of all callback
        // so the waitFor method could find a promise to wait
        // even if callbacks are not register in the right order
        callbacks.forEach(function (callback) {
            var d = $q.defer();
            self.promises.push(d.promise.then(function() { return $q.when(callback(payload, self)) }));
            defers.push(d);
        });

        // here we start the callbacks execution
        defers.forEach(function(d) {
            d.resolve();
        });

        // return all the callbacks results
        return $q.all(self.promises)
    };

    /**
     * Create the list of promise to execute from the callback register with the
     * {@see Dispatcher.waitForError} method of the dispatcher
     *
     * @param recovers
     * @param payload
     * @returns {function}
     */
    ExecutionContext.prototype.recover = function (/* Array */recovers, /* object */ payload) {
        return function(reason) {
            var _recoverPromises = [];
            recovers.forEach(function (/* function */ callback) {
                _recoverPromises.push($q(callback(payload, reason)));
            });
            if (_recoverPromises.length > 0) {
                return $q.all(_recoverPromises)
            } else {
                return $q.reject(reason)
            }
        }
    };

    /**
     * Allow to make a callback wait for the execution of another callback
     *
     *  // registering callback with an execution dependency
     *  var index1 = dispatcher.register(callback1);
     *  var index2 = dispatcher.register(function(payload , ec) {
         *      return ec.waitFor([index1]).then(callback2);
         *  });
     *
     * // on execution callback2 is execute after callback1 has finished
     * // if callback1 is a promise that fail, callback2 is not executed
     * dispatcher.dispatch(payloadObject)
     *
     * @param promiseIndexes
     * @returns {Promise}
     */
    ExecutionContext.prototype.waitFor = function (/* Array */ promiseIndexes) {
        var self = this;
        var selectedPromises = [];
        promiseIndexes.forEach(function (index) {
            if (self.promises[index]) {
                selectedPromises.push(self.promises[index]);
            } else {
                console.warn("No callback to waitFor at position "+index+". Execution will fail.")
                selectedPromises.push($q.reject(undefined));
            }
        });
        return $q.all(selectedPromises);
    };

    /**
     * this method return a promise
     * whatever the given parameter is a value or a promise
     * @param value
     * @returns {Promise}
     */
    ExecutionContext.prototype.when = function(value) {
        return $q.when(value)
    };

    /**
     * This method return a promise that always fail
     * @param value
     * @returns {*}
     */
    ExecutionContext.prototype.fail = function(value) {
        var deferred = $q.defer();
        deferred.reject(value);
        return deferred.promise;
    };

    /**
     * This method return a deferred
     * @returns {*}
     */
    ExecutionContext.prototype.defer = function() {
        return $q.defer();
    };

    return ExecutionContext
});
