const should = require('should'),
    sinon = require('sinon'),
    _ = require('lodash'),
    settingsCache = require('../../../../server/services/settings/cache'),
    common = require('../../../../server/lib/common'),
    controllers = require('../../../../frontend/services/routing/controllers'),
    TaxonomyRouter = require('../../../../frontend/services/routing/TaxonomyRouter'),
    RESOURCE_CONFIG = require('../../../../frontend/services/routing/config/v2'),
    RESOURCE_CONFIG_CANARY = require('../../../../frontend/services/routing/config/canary');

describe('UNIT - services/routing/TaxonomyRouter', function () {
    let req, res, next;

    beforeEach(function () {
        sinon.stub(settingsCache, 'get').withArgs('permalinks').returns('/:slug/');

        sinon.stub(common.events, 'emit');
        sinon.stub(common.events, 'on');

        sinon.spy(TaxonomyRouter.prototype, 'mountRoute');
        sinon.spy(TaxonomyRouter.prototype, 'mountRouter');

        req = sinon.stub();
        res = sinon.stub();
        next = sinon.stub();

        res.locals = {};
    });

    afterEach(function () {
        sinon.restore();
    });

    it('instantiate', function () {
        const taxonomyRouter = new TaxonomyRouter('tag', '/tag/:slug/');

        should.exist(taxonomyRouter.router);
        should.exist(taxonomyRouter.rssRouter);

        taxonomyRouter.taxonomyKey.should.eql('tag');
        taxonomyRouter.getPermalinks().getValue().should.eql('/tag/:slug/');

        common.events.emit.calledOnce.should.be.true();
        common.events.emit.calledWith('router.created', taxonomyRouter).should.be.true();

        taxonomyRouter.mountRouter.callCount.should.eql(1);
        taxonomyRouter.mountRouter.args[0][0].should.eql('/tag/:slug/');
        taxonomyRouter.mountRouter.args[0][1].should.eql(taxonomyRouter.rssRouter.router());

        taxonomyRouter.mountRoute.callCount.should.eql(3);

        // permalink route
        taxonomyRouter.mountRoute.args[0][0].should.eql('/tag/:slug/');
        taxonomyRouter.mountRoute.args[0][1].should.eql(controllers.channel);

        // pagination feature
        taxonomyRouter.mountRoute.args[1][0].should.eql('/tag/:slug/page/:page(\\d+)');
        taxonomyRouter.mountRoute.args[1][1].should.eql(controllers.channel);

        // edit feature
        taxonomyRouter.mountRoute.args[2][0].should.eql('/tag/:slug/edit');
        taxonomyRouter.mountRoute.args[2][1].should.eql(taxonomyRouter._redirectEditOption.bind(taxonomyRouter));
    });

    it('v2:fn: _prepareContext', function () {
        const taxonomyRouter = new TaxonomyRouter('tag', '/tag/:slug/', RESOURCE_CONFIG);
        taxonomyRouter._prepareContext(req, res, next);
        next.calledOnce.should.eql(true);

        res.routerOptions.should.eql({
            type: 'channel',
            name: 'tag',
            permalinks: '/tag/:slug/',
            resourceType: RESOURCE_CONFIG.QUERY.tag.resource,
            data: {tag: RESOURCE_CONFIG.QUERY.tag},
            filter: RESOURCE_CONFIG.TAXONOMIES.tag.filter,
            context: ['tag'],
            slugTemplate: true,
            identifier: taxonomyRouter.identifier
        });
    });

    it('canary:fn: _prepareContext', function () {
        const taxonomyRouter = new TaxonomyRouter('tag', '/tag/:slug/', RESOURCE_CONFIG_CANARY);
        taxonomyRouter._prepareContext(req, res, next);
        next.calledOnce.should.eql(true);

        res.routerOptions.should.eql({
            type: 'channel',
            name: 'tag',
            permalinks: '/tag/:slug/',
            resourceType: RESOURCE_CONFIG.QUERY.tag.resource,
            data: {tag: RESOURCE_CONFIG.QUERY.tag},
            filter: RESOURCE_CONFIG.TAXONOMIES.tag.filter,
            context: ['tag'],
            slugTemplate: true,
            identifier: taxonomyRouter.identifier
        });
    });
});
