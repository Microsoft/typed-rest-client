// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as httpm from 'typed-rest-client/HttpClient';
import * as hm from 'typed-rest-client/Handlers';
import * as fs from 'fs';
import * as path from 'path';

let sampleFilePath: string = path.join(__dirname, 'testoutput.txt');

describe('Http Tests', function () {
    let _http: httpm.HttpClient;
    let _httpbin: httpm.HttpClient;

    before(() => {
        _http = new httpm.HttpClient('typed-test-client-tests');
    });

    after(() => {
    });

    it('constructs', () => {
        this.timeout(1000);

        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        assert(http, 'http client should not be null');
    });

    // responses from httpbin return something like:
    // {
    //     "args": {}, 
    //     "headers": {
    //       "Connection": "close", 
    //       "Host": "httpbin.org", 
    //       "User-Agent": "typed-test-client-tests"
    //     }, 
    //     "origin": "173.95.152.44", 
    //     "url": "https://httpbin.org/get"
    //  }
    it('does basic http get request', async() => {
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
        assert('User-Agent' in obj.headers === true, "User-Agent should be set");
    });

    it('does basic http get request with undefined agent', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient(undefined);
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
        assert('User-Agent' in obj.headers === false, "User-Agent should not be set");
    });

    it('does basic http get request with null agent', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient(null);
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
        assert('User-Agent' in obj.headers === false, "User-Agent should not be set");
    });

    it('does basic http get request with empty agent', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient('');
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
        assert('User-Agent' in obj.headers === true, "User-Agent should be set");
        assert(obj.headers['User-Agent'] === '', "User-Agent should be set to empty string");
    });

    it('does basic https get request', async() => {
        let res: httpm.HttpClientResponse = await _http.get('https://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj: any = JSON.parse(body);
        assert(obj.url === "https://httpbin.org/get");
    });

    it('does basic http get request with gzip encoded response', async() => {
        const httpResponse: httpm.HttpClientResponse = await _http.get('http://httpbin.org/gzip');
        const body: string = await httpResponse.readBody();
        const bodyAsJSON:any = JSON.parse(body);

        assert(bodyAsJSON.headers && bodyAsJSON.headers.Host === "httpbin.org");
        assert(httpResponse.message.statusCode == 200, "status code should be 200");
    });

    it('does basic https get request with gzip encoded response', async() => {
        const httpResponse: httpm.HttpClientResponse = await _http.get('https://httpbin.org/gzip');
        const body: string = await httpResponse.readBody();
        const bodyAsJSON:any = JSON.parse(body);

        assert(bodyAsJSON.headers && bodyAsJSON.headers.Host === "httpbin.org");
        assert(httpResponse.message.statusCode == 200, "status code should be 200");
    });

    it('does basic http get request with basic auth', async() => {
        let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [bh]);
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody(); 
        let obj:any = JSON.parse(body);
        let auth: string = obj.headers.Authorization;
        let creds: string = Buffer.from(auth.substring('Basic '.length), 'base64').toString();
        assert(creds === 'johndoe:password', "should be the username and password");
        assert(obj.url === "http://httpbin.org/get");
    });
    
    it('does basic http get request with pat token auth', async() => {
        let token: string = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs';
        let ph: hm.PersonalAccessTokenCredentialHandler = 
            new hm.PersonalAccessTokenCredentialHandler(token);
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [ph]);
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody(); 
        let obj:any = JSON.parse(body);
        let auth: string = obj.headers.Authorization;
        let creds: string = Buffer.from(auth.substring('Basic '.length), 'base64').toString();
        assert(creds === 'PAT:' + token, "creds should be the token");
        assert(obj.url === "http://httpbin.org/get");
    });
    
    it('does basic http get request with default headers', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [], {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody(); 
        let obj:any = JSON.parse(body);
        assert(obj.headers.Accept === 'application/json', "Accept header should be 'application/json'");
        assert(obj.headers['Content-Type'] === 'application/json', "Content-Type header should be 'application/json'");
        assert(obj.url === "http://httpbin.org/get");
    });
    
    it('does basic http get request with merged headers', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [], {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get', {
            'content-type': 'application/x-www-form-urlencoded'
        });
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody(); 
        let obj:any = JSON.parse(body);
        assert(obj.headers.Accept === 'application/json', "Accept header should be 'application/json'");
        assert(obj.headers['Content-Type'] === 'application/x-www-form-urlencoded', "Content-Type header should be 'application/x-www-form-urlencoded'");
        assert(obj.url === "http://httpbin.org/get");
    });

    it('pipes a get request', () => {
        return new Promise<string>(async (resolve, reject) => {
            let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath);
            (await _http.get('https://httpbin.org/get')).message.pipe(file).on('close', () => {
                let body: string = fs.readFileSync(sampleFilePath).toString();
                let obj:any = JSON.parse(body);
                assert(obj.url === "https://httpbin.org/get", "response from piped stream should have url");
                resolve();
            });
        });
    });
    
    it('does basic get request with redirects', async() => {
        let res: httpm.HttpClientResponse = await _http.get("https://httpbingo.org/redirect-to?url=" + encodeURIComponent("https://httpbin.org/get"))
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.url === "https://httpbin.org/get");
    });

    it('does basic get request with redirects (303)', async() => {
        let res: httpm.HttpClientResponse = await _http.get("https://httpbingo.org/redirect-to?url=" + encodeURIComponent("https://httpbin.org/get") + '&status_code=303')
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.url === "https://httpbin.org/get");
    });

    it('returns 404 for not found get request on redirect', async() => {
        let res: httpm.HttpClientResponse = await _http.get("https://httpbin.org/redirect-to?url=" + encodeURIComponent("https://httpbin.org/status/404") + '&status_code=303')
        assert(res.message.statusCode == 404, "status code should be 404");
        let body: string = await res.readBody();
    });

    it('does not follow redirects if disabled', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', null, { allowRedirects: false });
        let res: httpm.HttpClientResponse = await http.get("https://httpbingo.org/redirect-to?url=" + encodeURIComponent("https://httpbin.org/get"))
        assert(res.message.statusCode == 302, "status code should be 302");
        let body: string = await res.readBody();
    });

    it('does basic head request', async() => {
        let res: httpm.HttpClientResponse = await _http.head('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
    });

    it('does basic http delete request', async() => {
        let res: httpm.HttpClientResponse = await _http.del('http://httpbin.org/delete');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
    });

    it('does basic http post request', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.post('http://httpbin.org/post', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/post");
    });
    
    it('does basic http patch request', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.patch('http://httpbin.org/patch', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/patch");
    });
    
    it('does basic http options request', async() => {
        let res: httpm.HttpClientResponse = await _http.options('http://httpbin.org');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
    });
    
    it('returns 404 for not found get request', async() => {
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/status/404');
        assert(res.message.statusCode == 404, "status code should be 404");
        let body: string = await res.readBody();
    });
});

describe('Http Tests with keepAlive', function () {
    let _http: httpm.HttpClient;

    before(() => {
        _http = new httpm.HttpClient('typed-test-client-tests', [], { keepAlive: true });
    });

    after(() => {
    });

    it('does basic http get request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
    });

    it('does basic head request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.head('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
    });    

    it('does basic http delete request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.del('http://httpbin.org/delete');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
    });

    it('does basic http post request with keepAlive true', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.post('http://httpbin.org/post', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/post");
    });
    
    it('does basic http patch request with keepAlive true', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.patch('http://httpbin.org/patch', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/patch");
    }); 
    
    it('does basic http options request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.options('http://httpbin.org');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
    });
});
