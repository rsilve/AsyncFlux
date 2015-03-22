var expect = require("expect.js");
var sinon = require("sinon");

var Q = require("q");

var Dispatcher = require("../../src/js/dispatcher");

describe('dispatcher service', function () {
    var dispatcher;

    // Load the module which contains the directive
    beforeEach(function () {
        dispatcher = new Dispatcher();
    });


    it('should have a register method return an index position', function () {
        var index = dispatcher.register(function () {
            return 1
        });
        expect(index).to.equal(0);
        index = dispatcher.register(function () {
            return 1
        });
        expect(index).to.equal(1)
    });

    it('should have a run method that succeed if all registered callback succeed', function () {
        dispatcher.register(function (p) {
            return p
        });
        dispatcher.register(function (p) {
            return p
        });
        dispatcher.run(true).then(function (v) {
            expect(v.length).to.equal(2);
            expect(v[0]).to.be(true);
            expect(v[1]).to.be(true);
        });
    });


    it('should have a run method that success if all registered success', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();

        dispatcher.register(function (p) {
            return p
        });
        dispatcher.run(1).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerThen.calledWith([1])).to.be.ok();
            //expect(handlerCatch.called).to.not.be.ok();
            done()
        })
    });


    it('should have a run method that fail if one registered fail', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();

        dispatcher.register(function (p) {
            return p
        });
        dispatcher.register(function (p, ec) {
            return ec.fail(1)
        });
        dispatcher.run(true).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.calledWith(1)).to.be.ok();
            expect(handlerThen.called).to.not.be.ok();
            done();
        });

    });



    it('should have a waitForError for recovering on dispatch error ', function (done) {
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();

        dispatcher.register(function (p) {
            return p
        });
        dispatcher.register(function (p, ec) {
            return ec.fail("FAIL")
        });
        dispatcher.waitForError(function (p, err) {
            return err
        });
        dispatcher.run(true).then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).to.not.be.ok();
            expect(handlerThen.called).to.be.ok();
            //console.log(handlerThen.getCall(0).args)
            expect(handlerThen.calledWith(["FAIL"])).to.be.ok();
            done();
        });
    });



    it('should have a waitFor method for manage dependencies on dispatch', function (done) {

        var index = dispatcher.register(function () {
            return 1
        });
        dispatcher.register(function () {
            return 2
        });
        dispatcher.register(function (payload, ec) {
            return ec.waitFor([index])
                .then(function (v) {
                    expect(v.length).to.equal(1);
                    expect(v[0]).to.be(1);
                    return v[0] + 1
                })
        });
        dispatcher.run(true).then(function (v) {
            expect(v.length).to.equal(3);
            expect(v[0] + v[1] + v[2]).to.be(5);
            done()
        });

    });

    it('could use promise as result of callback', function (done) {
        var d = Q.defer();
        var handlerCatch = sinon.spy();
        var handlerThen = sinon.spy();
        var index, index2;

        index = dispatcher.register(function (p, ec) {
            return d.promise
        });

        index2 = dispatcher.register(function (p, ec) {
            return ec.waitFor([index])
                .then(function (v) {
                    return v + "B"
                })
        });
        dispatcher.register(function (p, ec) {
            return ec.waitFor([index2])
                .then(function (v) {
                    return v + "C"
                })
        });

        var p = dispatcher.run(1);

        expect(p.isPending()).to.be.ok();
        expect(handlerCatch.called).not.to.be.ok();
        expect(handlerThen.called).not.to.be.ok();
        d.resolve("A");

        p.then(handlerThen).catch(handlerCatch).then(function() {
            expect(handlerCatch.called).not.to.be.ok();
            expect(handlerThen.calledWith(["A", "AB", "ABC"])).to.be.ok();
            done();
        });


    });

});