// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import nock = require('nock');
import * as ifm from 'typed-rest-client/Interfaces';
import * as restm from 'typed-rest-client/RestClient';
import * as util from 'typed-rest-client/Util';

export interface HttpData {
    url: string;
    data: any;
    json: any;
    args?: any
}

describe('Rest Tests', function () {
    let _rest: restm.RestClient;
    let _restBin: restm.RestClient;
    let _restMic: restm.RestClient;
    let _queryParams: ifm.IRequestQueryParams;

    before(() => {
        _rest = new restm.RestClient('typed-rest-client-tests');
        _restBin = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org');
        _restMic = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com');
        _queryParams = {
            params: {
                id: 1,
                foo: 'bar'
            }
        };
    });

    after(() => {
    });

    afterEach(() => {
        nock.cleanAll();
    })

    it('constructs', () => {
        this.timeout(1000);

        let rest: restm.RestClient = new restm.RestClient('typed-rest-client-tests');
        assert(rest, 'rest client should not be null');
    })

    it('gets a resource', async() => {
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                url: 'http://microsoft.com',
                data: null,
                json: null
            }, {
                'my-header': 'my-header-val'
            });
        let restRes: restm.IRestResponse<HttpData> = await _rest.get<HttpData>('http://microsoft.com');
        assert(restRes.headers['my-header'] === 'my-header-val', 'Response should include headers');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com');
    });

    it('gets a resource with baseUrl', async() => {
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                url: 'http://microsoft.com',
                data: null,
                json: null
            });
        let restRes: restm.IRestResponse<HttpData> = await _restMic.get<HttpData>('');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com');
    });

    it('gets a resource and correctly deserializes its Date property', async() => {
        //Arrange
        const dateObject: Date = new Date(2018, 9, 24, 10, 54, 11, 1);
        nock('http://microsoft.com')
            .get('/date')
            .reply(200, {
                json: {dateProperty: dateObject.toDateString()}
            });
        
        //Act
        const restRes: restm.IRestResponse<HttpData> = await _rest.get<HttpData>('http://microsoft.com/date', {deserializeDates: true});

        //Assert
        assert(restRes.result);
        const dateProperty: Date = restRes.result.json.dateProperty;
        assert(dateProperty.getTime, 'dateProperty should have a getTime method');
        assert.equal(dateProperty.getFullYear(), 2018);
        assert.equal(dateProperty.getMonth(), 9);
        assert.equal(dateProperty.getDate(), 24);

    });

    it('gets a resource and doesn\'t deserialize its non-Date property', async() => {
        //Arrange
        const nonDateObject: string = 'stringObject';
        nock('http://microsoft.com')
            .get('/date')
            .reply(200, {
                json: {nonDateProperty: nonDateObject}
            });

        //Act
        const restRes: restm.IRestResponse<HttpData> = await _rest.get<HttpData>('http://microsoft.com/date', {deserializeDates: true});

        //Assert
        assert(restRes.result);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert.equal(typeof(restRes.result.json.nonDateProperty), 'string');
        assert.equal(restRes.result.json.nonDateProperty, 'stringObject');
    });

    it('creates a resource', async() => {
        nock('http://microsoft.com')
            .post('/')
            .reply(200, function(uri, requestBody) {
                let body = JSON.parse(requestBody);
                return {
                    url: 'http://microsoft.com/post',
                    data: null,
                    json: body.name
                };
            });
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpData> = await _rest.create<HttpData>('http://microsoft.com', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/post');
        assert(restRes.result && restRes.result.json === 'foo');
    });

    it('creates a resource with a url encoded body', async () => {
        nock('http://microsoft.com')
            .post('/')
            .reply(200, function (uri, requestBody) {
                let body = decodeURI(requestBody);
                return {
                    url: 'http://microsoft.com/post',
                    data: body,
                    json: null
                };
            });
        let options: restm.IRequestOptions = {
            additionalHeaders: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };
        let res: string = 'url%20encoded%20body';
        let restRes: restm.IRestResponse<HttpData> = await _rest.create<HttpData>('http://microsoft.com', res, options);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/post');
        assert(restRes.result && restRes.result.data === 'url encoded body');
    });

    it('creates a resource with a baseUrl', async() => {
        nock('http://microsoft.com')
            .post('/')
            .reply(200, function(uri, requestBody) {
                let body = JSON.parse(requestBody);
                return {
                    url: 'http://microsoft.com/post',
                    data: null,
                    json: body.name
                };
            });
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpData> = await _restMic.create<HttpData>('', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/post');
        assert(restRes.result && restRes.result.json === 'foo');
    });

    it('replaces a resource', async() => {
        nock('http://microsoft.com')
            .put('/')
            .reply(200, function(uri, requestBody) {
                let body = JSON.parse(requestBody);
                return {
                    url: 'http://microsoft.com/put',
                    data: null,
                    json: body.name
                };
            });
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpData> = await _rest.replace<HttpData>('http://microsoft.com', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/put');
        assert(restRes.result && restRes.result.json === 'foo');
    });

    it('replaces a resource with a baseUrl', async() => {
        nock('http://microsoft.com')
            .put('/')
            .reply(200, function(uri, requestBody) {
                let body = JSON.parse(requestBody);
                return {
                    url: 'http://microsoft.com/put',
                    data: null,
                    json: body.name
                };
            });
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpData> = await _restMic.replace<HttpData>('', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/put');
        assert(restRes.result && restRes.result.json === 'foo');
    });

    it('updates a resource', async() => {
        nock('http://microsoft.com')
            .put('/')
            .reply(200, function(uri, requestBody) {
                let body = JSON.parse(requestBody);
                return {
                    url: 'http://microsoft.com/put',
                    data: null,
                    json: body.name
                };
            });
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpData> = await _rest.replace<HttpData>('http://microsoft.com', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/put');
        assert(restRes.result && restRes.result.json === 'foo');
    });

    it('updates a resource with a baseUrl', async() => {
        nock('http://microsoft.com')
            .put('/')
            .reply(200, function(uri, requestBody) {
                let body = JSON.parse(requestBody);
                return {
                    url: 'http://microsoft.com/put',
                    data: null,
                    json: body.name
                };
            });
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpData> = await _restMic.replace<HttpData>('', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/put');
        assert(restRes.result && restRes.result.json === 'foo');
    });

    it('deletes a resource', async() => {
        nock('http://microsoft.com')
            .delete('/')
            .reply(200, {
                url: 'http://microsoft.com/delete',
                data: null,
                json: null
            });
        let restRes: restm.IRestResponse<HttpData> = await _rest.del<HttpData>('http://microsoft.com');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/delete');
    });

    it('deletes a resource with a baseUrl', async() => {
        nock('http://microsoft.com')
            .delete('/')
            .reply(200, {
                url: 'http://microsoft.com/delete',
                data: null,
                json: null
            });
        let restRes: restm.IRestResponse<HttpData> = await _restMic.del<HttpData>('');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/delete');
    });

    it('does an options request', async() => {
        nock('http://microsoft.com')
            .options('/')
            .reply(200, {
                url: 'http://microsoft.com/options',
                data: null,
                json: null
            });
        let restRes: restm.IRestResponse<HttpData> = await _rest.options<HttpData>('http://microsoft.com');
        assert(restRes.statusCode == 200, "statusCode should be 200");
    });

    it('does an options request with baseUrl', async() => {
        nock('http://microsoft.com')
            .options('/')
            .reply(200, {
                url: 'http://microsoft.com/options',
                data: null,
                json: null
            });
        let restRes: restm.IRestResponse<HttpData> = await _restMic.options<HttpData>('');
        assert(restRes.statusCode == 200, "statusCode should be 200");
    });

    //----------------------------------------------
    // Get Error Cases
    //----------------------------------------------

    //
    // Resource not found (404)
    // should return a null resource, 404 status, and should not throw
    //
    it('gets a non-existant resource (404)', async() => {
        nock('http://microsoft.com')
            .get('/status/404')
            .reply(404);
        let restRes: restm.IRestResponse<HttpData>;
        try {
            restRes= await _rest.get<HttpData>('http://microsoft.com/status/404');
        }
        catch(err) {
            console.log(err);
            assert(false, "Request should succeed, should not throw");
        }
        assert(restRes.statusCode == 404, "statusCode should be 404");
        assert(restRes.result === null, "object should be null");
    });

    //
    // Unauthorized (401)
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //
    it('gets and handles unauthorized (401)', async() => {
        nock('http://microsoft.com')
            .get('/status/401')
            .reply(401, {'message': 'something awful happened', 'statusCode': 401});
        try {
            let restRes: restm.IRestResponse<HttpData> = await _rest.get<HttpData>('http://microsoft.com/status/401');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 401, "statusCode should be 401");
            assert(err.result && err.result['message'] === 'something awful happened', "should have error message with the response");
        }
    });

    //
    // Internal Server Error
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //
    it('gets and handles a server error (500)', async() => {
        nock('http://microsoft.com')
            .get('/status/500')
            .reply(500, {'message': 'something awful happened', 'statusCode': 500});
        try {
            let restRes: restm.IRestResponse<HttpData> = await _rest.get<HttpData>('http://microsoft.com/status/500');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 500, "statusCode should be 500");
            assert(err.result && err.result['message'] === 'something awful happened', "should have error message with the response");
        }
    });

    //--------------------------------------------------------
    // Path in baseUrl tests
    //--------------------------------------------------------
    it('maintains the path from the base url with no slashes', async() => {
        nock('http://microsoft.com')
            .get('/anything/anythingextra')
            .reply(200, {
                url: 'http://microsoft.com/anything/anythingextra',
                data: null,
                json: null
            });

        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com/anything');

        // Act
        let restRes: restm.IRestResponse<HttpData> = await rest.get<HttpData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/anything/anythingextra');
    });

    it('maintains the path from the base url with double slashes', async() => {
        nock('http://microsoft.com')
            .get('/anything/anythingextra')
            .reply(200, {
                url: 'http://microsoft.com/anything/anythingextra',
                data: null,
                json: null
            });

        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com/anything/');

        // Act
        let restRes: restm.IRestResponse<HttpData> = await rest.get<HttpData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/anything/anythingextra');
    });

    it('maintains the path from the base url with multiple parts', async() => {
        nock('http://microsoft.com')
            .get('/anything/extrapart/anythingextra')
            .reply(200, {
                url: 'http://microsoft.com/anything/extrapart/anythingextra',
                data: null,
                json: null
            });
        
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com/anything/extrapart');

        // Act
        let restRes: restm.IRestResponse<HttpData> = await rest.get<HttpData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/anything/extrapart/anythingextra');
    });

    it('maintains the path from the base url where request has multiple parts', async() => {
        nock('http://microsoft.com')
            .get('/anything/anythingextra/moreparts')
            .reply(200, {
                url: 'http://microsoft.com/anything/anythingextra/moreparts',
                data: null,
                json: null
            });
        
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com/anything');

        // Act
        let restRes: restm.IRestResponse<HttpData> = await rest.get<HttpData>('anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/anything/anythingextra/moreparts');
    });

    it('maintains the path from the base url where both have multiple parts', async() => {
        nock('http://microsoft.com')
            .get('/anything/multiple/anythingextra/moreparts')
            .reply(200, {
                url: 'http://microsoft.com/anything/multiple/anythingextra/moreparts',
                data: null,
                json: null
            });
        
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com/anything/multiple');

        // Act
        let restRes: restm.IRestResponse<HttpData> = await rest.get<HttpData>('anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/anything/multiple/anythingextra/moreparts');
    });

    it('maintains the path from the base url where request has query parameters', async() => {
        nock('http://microsoft.com')
            .get('/anything/multiple/anythingextra/moreparts')
            .query({
                foo: 'bar',
                baz: 'top'
            })
            .reply(200, {
                url: 'http://microsoft.com/anything/multiple/anythingextra/moreparts?foo=bar&baz=top',
                data: null,
                json: null,
                args: {foo: 'bar', baz: 'top'}
            });
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'http://microsoft.com/anything/multiple');

        // Act
        let restRes: restm.IRestResponse<HttpData> = await rest.get<HttpData>('anythingextra/moreparts?foo=bar&baz=top');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'http://microsoft.com/anything/multiple/anythingextra/moreparts?foo=bar&baz=top');
        assert(restRes.result && restRes.result.args.foo === 'bar');
        assert(restRes.result && restRes.result.args.baz === 'top');
    });

    //
    // getUrl path tests
    //
    it('resolves a just host resource and no baseUrl', async() => {
        let res: string = util.getUrl('http://microsoft.com');
        assert(res === 'http://microsoft.com', "should be http://microsoft.com");
    });

    it('resolves a empty resource with baseUrl', async() => {
        let res: string = util.getUrl('', 'http://microsoft.com');
        assert(res === 'http://microsoft.com', "should be http://microsoft.com");
    });

    it('resolves a null resource with baseUrl', async() => {
        let res: string = util.getUrl(null, 'http://microsoft.com');
        assert(res === 'http://microsoft.com', "should be http://microsoft.com");
    });

    it('resolves a host resource with empty baseUrl and passing query parameters', async() => {
        const res: string = util.getUrl('http://microsoft.com', '', _queryParams);
        assert(res === 'http://microsoft.com?id=1&foo=bar', `should be http://microsoft.com?id=1&foo=bar but is ${res}`);
    });

    it('resolves an empty resource with baseUrl and passing query parameters', async() => {
        const res: string = util.getUrl('', 'http://microsoft.com', _queryParams);
        assert(res === 'http://microsoft.com?id=1&foo=bar', `should be http://microsoft.com?id=1&foo=bar but is ${res}`);
    });

    it('resolves a null resource with baseUrl and passing query parameters', async() => {
        const res: string = util.getUrl(null, 'http://microsoft.com', _queryParams);
        assert(res === 'http://microsoft.com?id=1&foo=bar', `should be http://microsoft.com?id=1&foo=bar but is ${res}`);
    });

    it('resolves a full resource and no baseUrl', async() => {
        let res: string = util.getUrl('http://microsoft.com/get?x=y&a=b');
        assert(res === 'http://microsoft.com/get?x=y&a=b', `should be http://microsoft.com/get?x=y&a=b but is ${res}`);
    });

    it('resolves a rooted path resource with host baseUrl', async() => {
        let res: string = util.getUrl('/get/foo', 'http://microsoft.com');
        assert(res === 'http://microsoft.com/get/foo', `should be http://microsoft.com/get/foo but is ${res}`);
    });

    it('resolves a relative path resource with host baseUrl', async() => {
        let res: string = util.getUrl('get/foo', 'http://microsoft.com');
        assert(res === 'http://microsoft.com/get/foo', `should be http://microsoft.com/get/foo but is ${res}`);
    });

    it('resolves a rooted path resource with host baseUrl and passing query parameters', async() => {
        const res: string = util.getUrl('/get/foo', 'http://microsoft.com', _queryParams);
        assert(res === 'http://microsoft.com/get/foo?id=1&foo=bar', `should be http://microsoft.com/get/foo?id=1&foo=bar but is ${res}`)
    });

    it('resolves a relative path resource with host baseUrl and passing query parameters', async() => {
        const res: string = util.getUrl('get/foo', 'http://microsoft.com', _queryParams);
        assert(res === 'http://microsoft.com/get/foo?id=1&foo=bar', `should be http://microsoft.com/get/foo?id=1&foo=bar but is ${res}`);
    });

    it('resolves a rooted path resource with pathed baseUrl', async() => {
        let res: string = util.getUrl('/get/foo', 'http://microsoft.com/bar');
        assert(res === 'http://microsoft.com/get/foo', "should be http://microsoft.com/get/foo");
    });

    it('resolves a relative path resource with pathed baseUrl', async() => {
        let res: string = util.getUrl('get/foo', 'http://microsoft.com/bar');
        assert(res === 'http://microsoft.com/bar/get/foo', `should be http://microsoft.com/bar/get/foo but is ${res}`);
    });
});
