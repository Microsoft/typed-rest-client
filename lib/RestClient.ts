/**
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project root for full license information.
 */

import * as fs from 'fs';
import * as http from 'http';
import HttpClient = require('./HttpClient');
import Interfaces = require('./Interfaces');
import Util = require("./Util");

export interface IRestResponse<T> {
    statusCode: number;
    result: T;
}

export interface IRequestOptions {
    // defaults to application/json
    // common versioning is application/json;version=2.1
    acceptHeader?: string;
    // since accept is defaulted, set additional headers if needed
    additionalHeaders?: Interfaces.IHeaders;

    responseProcessor?: Function;
}

export class RestClient {
    public client: HttpClient.HttpClient;
    public versionParam: string;

    private _baseUrl: string;

    /**
     * Creates an instance of the RestClient
     * @constructor
     * @param {string} userAgent - userAgent for requests
     * @param {string} baseUrl - (Optional) If not specified, use full urls per request.  If supplied and a function passes a relative url, it will be appended to this
     * @param {Interfaces.IRequestHandler[]} handlers - handlers are typically auth handlers (basic, bearer, ntlm supplied)
     * @param {Interfaces.IRequestOptions} requestOptions - options for each http requests (http proxy setting, socket timeout)
     */
    constructor(userAgent: string,
                baseUrl?: string,
                handlers?: Interfaces.IRequestHandler[],
                requestOptions?: Interfaces.IRequestOptions) {
        this.client = new HttpClient.HttpClient(userAgent, handlers, requestOptions);
        if (baseUrl) {
            this._baseUrl = baseUrl;
        }
    }

    /**
     * Gets a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async options<T>(requestUrl: string,
                            options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(requestUrl, this._baseUrl);
        const res: HttpClient.HttpClientResponse = await this.client.options(url, this._headersFromOptions(options));

        return this._processResponse<T>(res, options);
    }

    /**
     * Gets a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified url or relative path
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async get<T>(resource: string,
                        options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(resource, this._baseUrl);
        const res: HttpClient.HttpClientResponse = await this.client.get(url, this._headersFromOptions(options));

        return this._processResponse<T>(res, options);
    }

    /**
     * Deletes a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async del<T>(resource: string,
                        options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(resource, this._baseUrl);
        const res: HttpClient.HttpClientResponse = await this.client.del(url, this._headersFromOptions(options));

        return this._processResponse<T>(res, options);
    }

    /**
     * Creates resource(s) from an endpoint
     * T type of object returned.
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async create<T>(resource: string,
                           resources: any,
                           options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(resource, this._baseUrl);
        const headers: Interfaces.IHeaders = this._headersFromOptions(options, true);

        const data: string = JSON.stringify(resources, null, 2);
        const res: HttpClient.HttpClientResponse = await this.client.post(url, data, headers);

        return this._processResponse<T>(res, options);
    }

    /**
     * Updates resource(s) from an endpoint
     * T type of object returned.
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async update<T>(resource: string,
                           resources: any,
                           options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(resource, this._baseUrl);
        const headers: Interfaces.IHeaders = this._headersFromOptions(options, true);

        const data: string = JSON.stringify(resources, null, 2);
        const res: HttpClient.HttpClientResponse = await this.client.patch(url, data, headers);

        return this._processResponse<T>(res, options);
    }

    /**
     * Replaces resource(s) from an endpoint
     * T type of object returned.
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async replace<T>(resource: string,
                            resources: any,
                            options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(resource, this._baseUrl);
        const headers: Interfaces.IHeaders = this._headersFromOptions(options, true);

        const data: string = JSON.stringify(resources, null, 2);
        const res: HttpClient.HttpClientResponse = await this.client.put(url, data, headers);

        return this._processResponse<T>(res, options);
    }

    public async uploadStream<T>(verb: string,
                                 requestUrl: string,
                                 stream: NodeJS.ReadableStream,
                                 options?: IRequestOptions): Promise<IRestResponse<T>> {

        const url: string = Util.getUrl(requestUrl, this._baseUrl);
        const headers: Interfaces.IHeaders = this._headersFromOptions(options, true);

        const res: HttpClient.HttpClientResponse = await this.client.sendStream(verb, url, stream, headers);

        return this._processResponse<T>(res, options);
    }

    private _headersFromOptions(options: IRequestOptions, contentType?: boolean): Interfaces.IHeaders {
        options = options || {};
        const headers: Interfaces.IHeaders = options.additionalHeaders || {};
        headers[HttpClient.Headers.Accept] = options.acceptHeader || 'application/json';

        if (contentType) {
            headers[HttpClient.Headers.ContentType] = headers[HttpClient.Headers.ContentType] || 'application/json; charset=utf-8';
        }

        return headers;
    }

    private async _processResponse<T>(res: HttpClient.HttpClientResponse, options: IRequestOptions): Promise<IRestResponse<T>> {
        return new Promise<IRestResponse<T>>(async (resolve, reject) => {
            const rres: IRestResponse<T> = <IRestResponse<T>>{};
            const statusCode: number = res.message.statusCode;
            rres.statusCode = statusCode;

            // not found leads to null obj returned
            if (statusCode == HttpClient.HttpCodes.NotFound) {
                resolve(rres);
            }

            let obj: any;

            // get the result from the body
            try {
                const contents: string = await res.readBody();
                if (contents && contents.length > 0) {
                    obj = JSON.parse(contents);
                    if (options && options.responseProcessor) {
                        rres.result = options.responseProcessor(obj);
                    }
                    else {
                        rres.result = obj;
                    }
                }
            }
            catch (err) {
                // Invalid resource (contents not json);  leaving result obj null
            }

            // note that 3xx redirects are handled by the http layer.
            if (statusCode > 299) {
                let msg: string;

                // if exception/error in body, attempt to get better error
                if (obj && obj.message) {
                    msg = obj.message;
                } else {
                    msg = `Failed request: (${statusCode})`;
                }

                const err: Error = new Error(msg);

                // attach statusCode and body obj (if available) to the error object
                err['statusCode'] = statusCode;
                if (rres.result) {
                    err['result'] = rres.result;
                }

                reject(err);
            } else {
                resolve(rres);
            }
        });
    }
}
