var expect = require("expect.js");
var sinon = require("sinon");

var ExecutionContext = require("../../src/js/ExecutionContext");

describe('ExecutionContext service', function () {
    var ec;

    // Load the module which contains the directive
    beforeEach(function() {
        ec = new ExecutionContext();
    });


    it('should have a fail method that return a failed  promise', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.fail(1).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.calledWith(1)).to.be.ok();
            expect(handlerThen.called).to.not.be.ok();
            done();
        })
       
    });

    it('should have a when method that return a resolved promise when the parameter a value', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.when(1).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.calledWith(1)).to.be.ok();
            done();
        });
    });

    it('should have a when method that return a resolved promise when no parameter is given', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.when().then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.called).to.be.ok();
            done();
        });
    });


    it('should have a when method that return promise when the parameter a promise', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.when(ec.fail(1)).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.calledWith(1)).to.be.ok();
            expect(handlerThen.called).to.not.be.ok();
            done();
        });
    });


    it('should have a when method run that generate a promise from a list of callback', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.run([
            function(p, ec) { return 1 },
            function(p, ec) { return 2 }
        ], 1).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.calledWith([1, 2])).to.be.ok();
            done();
        })
    });

    it('should have a method recover that generate a promise from a list of callback', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.run([], 1).then(ec.recover([
            function(p, ec) { return 1 },
            function(p, ec) { return 2 }
        ], 1)).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.calledWith([1, 2])).to.be.ok();
            done();
        })
    });

    it('should have a method recover that generate a failed promise from en empty list of callback', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.run([], 1).then(ec.recover([], 1)).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.be.ok();
            expect(handlerThen.called).to.not.be.ok();
            done();
        });

    });


    it('should have a method waitFor for help for control execution workflow', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.run([
            function(p, ec) { return p },
            function(p, ec) { return ec.waitFor([0]).then(function(v) { return v[0] + "B" }) }
        ], "A").then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.calledWith(["A", "AB"])).to.be.ok();
            done();
        });

    });

    it('should not have order constraint on waitFor usage', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.run([
            function(p, ec) { return ec.waitFor([1]).then(function(v) { return v[0] + "B" }) },
            function(p, ec) { return p }
        ], "A").then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.calledWith(["AB", "A"])).to.be.ok();
            done()
        })

    });


    it('should reject invalid waitFor usage', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        ec.run([
            // we use a waitFor index that does not exist
            function(p, ec) { return ec.waitFor([3]).then(function(v) { return v[0] + "B" }) },
            function(p, ec) { return p }
        ], "A").then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.be.ok();
            expect(handlerThen.called).to.not.be.ok();
            done();
        });
    });

});
