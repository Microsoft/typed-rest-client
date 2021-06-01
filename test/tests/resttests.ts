// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as restm from 'typed-rest-client/RestClient';
import * as util from 'typed-rest-client/Util';
import * as fs from 'fs';
import * as path from 'path';

export interface HttpBinData {
    url: string;
    data: any;
    json: any;
    args?: any;
    form: any;
}

describe('Rest Tests', function () {
    let _rest: restm.RestClient;
    let _restBin: restm.RestClient;
    let _options: restm.IRequestOptions;

    before(() => {
        _rest = new restm.RestClient('typed-rest-client-tests');
        _restBin = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org');
        _options = {
            queryParameters: {
                params: {
                    id: 1,
                    type: 'compact'
                }
            }
        }
    });

    after(() => {
    });

    it('constructs', () => {
        this.timeout(1000);

        let rest: restm.RestClient = new restm.RestClient('typed-test-client-tests');
        assert(rest, 'rest client should not be null');
    })

    it('gets a resource', async() => {
        this.timeout(3000);

        let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/get');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/get');
    });

    it('gets a resource with baseUrl', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.get<HttpBinData>('get');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/get');
    });

    it('gets a resource passing Query Parameters', async() => {
        this.timeout(3000);
        const response: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/get', _options);

        assert(response.statusCode == 200, "statusCode should be 200");
        assert(response.result.url === 'https://httpbin.org/get?id=1&type=compact');

        Object.keys(_options.queryParameters.params).forEach(key => {
            const actual = response.result.args[key];
            const expected = _options.queryParameters.params[key];

            assert(expected == actual);
        })
    });

    it('gets a resource with baseUrl passing Query Parameters', async() => {
        const response: restm.IRestResponse<HttpBinData> = await _restBin.get<HttpBinData>('get', _options);

        assert(response.statusCode == 200, "statusCode should be 200");
        assert(response.result.url === 'https://httpbin.org/get?id=1&type=compact');

        Object.keys(_options.queryParameters.params).forEach(key => {
            const actual = response.result.args[key];
            const expected = _options.queryParameters.params[key];

            assert(expected == actual);
        })
    });

    it('creates a resource', async() => {
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.create<HttpBinData>('https://httpbin.org/post', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/post');
        assert(restRes.result && restRes.result.json.name === 'foo');
    });

    it('creates a resource with a url encoded body', async () => {
        let options: restm.IRequestOptions = {
            additionalHeaders: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };
        let res: string = 'body=url%20encoded%20body';
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.create<HttpBinData>('post', res, options);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/post');
        assert(restRes.result && restRes.result.form.body === 'url encoded body');
    });

    it('creates a resource with a baseUrl', async() => {
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.create<HttpBinData>('post', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/post');
        assert(restRes.result && restRes.result.json.name === 'foo');
    });

    it('replaces a resource', async() => {
        this.timeout(3000);

        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.replace<HttpBinData>('https://httpbin.org/put', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/put');
        assert(restRes.result && restRes.result.json.name === 'foo');
    });

    it('replaces a resource with a baseUrl', async() => {
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.replace<HttpBinData>('put', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/put');
        assert(restRes.result && restRes.result.json.name === 'foo');
    });

    it('updates a resource', async() => {
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.update<HttpBinData>('https://httpbin.org/patch', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/patch');
        assert(restRes.result && restRes.result.json.name === 'foo');
    });

    it('updates a resource with a baseUrl', async() => {
        let res: any = { name: 'foo' };
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.update<HttpBinData>('patch', res);
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/patch');
        assert(restRes.result && restRes.result.json.name === 'foo');
    });

    it('deletes a resource', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.del<HttpBinData>('https://httpbin.org/delete');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/delete');
    });

    it('deletes a resource with a baseUrl', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.del<HttpBinData>('delete');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/delete');
    });

    it('deletes a resource passing Query Parameters', async () => {
        this.timeout(3000);
        const response: restm.IRestResponse<HttpBinData> = await _rest.del<HttpBinData>('https://httpbin.org/delete', _options);

        assert(response.statusCode == 200, "statusCode should be 200");
        assert(response.result.url === 'https://httpbin.org/delete?id=1&type=compact');

        Object.keys(_options.queryParameters.params).forEach(key => {
            const actual = response.result.args[key];
            const expected = _options.queryParameters.params[key];

            assert(expected == actual);
        })
    });

    it('deletes a resource with baseUrl passing Query Parameters', async () => {
        const response: restm.IRestResponse<HttpBinData> = await _restBin.del<HttpBinData>('delete', _options);

        assert(response.statusCode == 200, "statusCode should be 200");
        assert(response.result.url === 'https://httpbin.org/delete?id=1&type=compact');

        Object.keys(_options.queryParameters.params).forEach(key => {
            const actual = response.result.args[key];
            const expected = _options.queryParameters.params[key];

            assert(expected == actual);
        })
    });

    it('does an options request', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.options<HttpBinData>('https://httpbin.org');
        assert(restRes.statusCode == 200, "statusCode should be 200");
    });

    it('does an options request with baseUrl', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _restBin.options<HttpBinData>('');
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
        this.timeout(3000);

        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/404');

            assert(restRes.statusCode == 404, "statusCode should be 404");
            assert(restRes.result === null, "object should be null");
        }
        catch(err) {
            assert(false, "should not throw");
        }
    });

    //
    // Unauthorized (401)
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //
    it('gets and handles unauthorized (401)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/401');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 401, "statusCode should be 401");
            assert(err.message && err.message.length > 0, "should have error message");
        }
    });

    //
    // Internal Server Error
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //
    it('gets and handles a server error (500)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/500');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 500, "statusCode should be 500");
            assert(err.message && err.message.length > 0, "should have error message");
        }
    });

    //
    // Error with non JSON body
    // should return the text in the body if body is not JSON
    //
    // it('gets and handles an error with non JSON body', async() => { 
    //     this.timeout(5000);
    //     try {
    //         let restRes: restm.IRestResponse<any> = await _rest.get('https://httpstat.us/406');
    //         assert(false, "should throw");
    //     }
    //     catch(err) {
    //         assert(err['statusCode'] == 406, "statusCode should be 406");
    //         assert(err.message && err.message.length > 0, "should have error message");
    //         assert.equal(err.message, '"406 Not Acceptable"', "error message should be '406 Not Acceptable'");
    //     }
    // });

    //--------------------------------------------------------
    // Path in baseUrl tests
    //--------------------------------------------------------
    it('maintains the path from the base url', async() => {
        this.timeout(3000);

        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with no slashes', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with double slashes', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/extrapart');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/extrapart/anythingextra');
    });

    it('maintains the path from the base url where request has multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/anythingextra/moreparts');
    });

    it('maintains the path from the base url where both have multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/multiple');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/multiple/anythingextra/moreparts');
    });

    it('maintains the path from the base url where request has query parameters', async() => {
        // Arrange
        this.timeout(3000);
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/multiple');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra/moreparts?foo=bar&baz=top');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result && restRes.result.url === 'https://httpbin.org/anything/multiple/anythingextra/moreparts?foo=bar&baz=top');
        assert(restRes.result && restRes.result.args.foo === 'bar');
        assert(restRes.result && restRes.result.args.baz === 'top');
    });

    it('preserves trailing slashes in URLs', async () => {
        const res = util.getUrl('get/foo/', 'http://httpbin.org/bar');
        assert.equal(res, 'http://httpbin.org/bar/get/foo/');
    });
});
