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
}

describe('Rest Tests', function () {
    let _rest: restm.RestClient;

    before(() => {
        _rest = new restm.RestClient('typed-rest-client-tests');
    });

    after(() => {
    });

    it('constructs', () => {
        this.timeout(1000);
        
        let rest: restm.RestClient = new restm.RestClient('typed-test-client-tests');
        assert(rest, 'rest client should not be null');
    })

    it('gets a resource', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/get');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/get');
    });

    //----------------------------------------------
    // Get Error Cases
    //----------------------------------------------

    //
    // Resource not found (404)
    // should return a null resource, 404 status, and should not throw
    //
    it('gets a non-existant resource (404)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/404');
            
            assert(restRes.statusCode == 404, "statusCode should be 404");
            assert(restRes.result == null, "object should be null");
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
    // getUrl path tests
    //
    it('resolves a just host resource and no baseUrl', async() => {
        let res: string = util.getUrl('http://httpbin.org');
        assert(res === 'http://httpbin.org', "should be http://httpbin.org");
    });

    it('resolves a full resource and no baseUrl', async() => {
        let res: string = util.getUrl('http://httpbin.org/get?x=y&a=b');
        assert(res === 'http://httpbin.org/get?x=y&a=b', "should be http://httpbin.org/get?x=y&a=b");
    });

    it('resolves a rooted path resource with host baseUrl', async() => {
        let res: string = util.getUrl('/get/foo', 'http://httpbin.org');
        assert(res === 'http://httpbin.org/get/foo', "should be http://httpbin.org/get/foo");
    });

    it('resolves a rooted path resource with pathed baseUrl', async() => {
        let res: string = util.getUrl('/get/foo', 'http://httpbin.org/bar');
        assert(res === 'http://httpbin.org/get/foo', "should be http://httpbin.org/get/foo");
    });

    it('resolves a relative path resource with pathed baseUrl', async() => {
        let res: string = util.getUrl('get/foo', 'http://httpbin.org/bar');
        assert(res === 'http://httpbin.org/bar/get/foo', "should be http://httpbin.org/bar/get/foo");
    });
    // TODO: more tests here    
});