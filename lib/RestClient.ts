// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import httpm = require('./HttpClient');
import ifm = require("./Interfaces");
import util = require("./Util");

export interface IRestResponse<T> {
    statusCode: number,
    result: T | null,
    headers: Object
}

export interface IRequestOptions {
    // defaults to application/json
    // common versioning is application/json;version=2.1
    acceptHeader?: string,
    // since accept is defaulted, set additional headers if needed
    additionalHeaders?: ifm.IHeaders,

    responseProcessor?: Function,
    //Dates aren't automatically deserialized by JSON, this adds a date reviver to ensure they aren't just left as strings
    deserializeDates?: boolean,
    queryParameters?: ifm.IRequestQueryParams
}

export class RestClient {
    client: httpm.HttpClient;
    versionParam: string;

    /**
     * Creates an instance of the RestClient
     * @constructor
     * @param {string} userAgent - userAgent for requests
     * @param {string} baseUrl - (Optional) If not specified, use full urls per request.  If supplied and a function passes a relative url, it will be appended to this
     * @param {ifm.IRequestHandler[]} handlers - handlers are typically auth handlers (basic, bearer, ntlm supplied)
     * @param {ifm.IRequestOptions} requestOptions - options for each http requests (http proxy setting, socket timeout)
     */
    constructor(userAgent: string | null | undefined,
                baseUrl?: string,
                handlers?: ifm.IRequestHandler[],
                requestOptions?: ifm.IRequestOptions) {
        this.client = new httpm.HttpClient(userAgent, handlers, requestOptions);
        if (baseUrl) {
            this._baseUrl = baseUrl;
        }
    }

    private _baseUrl: string;

    /**
     * Gets a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async options<T>(requestUrl: string,
        options?: IRequestOptions): Promise<IRestResponse<T>> {

        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let res: httpm.HttpClientResponse = await this.client.options(url,
            this._headersFromOptions(options));
        return this.processResponse<T>(res, options);
    }

    /**
     * Gets a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified url or relative path
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async get<T>(resource: string,
        options?: IRequestOptions): Promise<IRestResponse<T>> {

        let url: string = util.getUrl(resource, this._baseUrl, (options || {}).queryParameters);
        let res: httpm.HttpClientResponse = await this.client.get(url,
            this._headersFromOptions(options));
        return this.processResponse<T>(res, options);
    }

    /**
     * Deletes a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} resource - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async del<T>(resource: string,
        options?: IRequestOptions): Promise<IRestResponse<T>> {

        let url: string = util.getUrl(resource, this._baseUrl, (options || {}).queryParameters);
        let res: httpm.HttpClientResponse = await this.client.del(url,
            this._headersFromOptions(options));
        return this.processResponse<T>(res, options);
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

        let url: string = util.getUrl(resource, this._baseUrl, (options || {}).queryParameters);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);

        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.post(url, data, headers);
        return this.processResponse<T>(res, options);
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

        let url: string = util.getUrl(resource, this._baseUrl, (options || {}).queryParameters);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);

        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.patch(url, data, headers);
        return this.processResponse<T>(res, options);
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

        let url: string = util.getUrl(resource, this._baseUrl, (options || {}).queryParameters);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);

        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.put(url, data, headers);
        return this.processResponse<T>(res, options);
    }

    public async uploadStream<T>(verb: string,
        requestUrl: string,
        stream: NodeJS.ReadableStream,
        options?: IRequestOptions): Promise<IRestResponse<T>> {

        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);

        let res: httpm.HttpClientResponse = await this.client.sendStream(verb, url, stream, headers);
        return this.processResponse<T>(res, options);
    }

    private _headersFromOptions(options: IRequestOptions, contentType?: boolean): ifm.IHeaders {
        options = options || {};
        let headers: ifm.IHeaders = options.additionalHeaders || {};
        headers["Accept"] = options.acceptHeader || "application/json";

        if (contentType) {
            let found: boolean = false;

            for (let header in headers) {
                if (header.toLowerCase() == "content-type") {
                    found = true;
                }
            }

            if (!found) {
                headers["Content-Type"] = 'application/json; charset=utf-8';
            }
        }

        return headers;
    }

    private static dateTimeDeserializer(key: any, value: any): any {
        if (typeof value === 'string'){
            let a = new Date(value);
            if (!isNaN(a.valueOf())) {
                return a;
            }
        }

        return value;
    }

    protected async processResponse<T>(res: httpm.HttpClientResponse, options: IRequestOptions): Promise<IRestResponse<T>> {
        return new Promise<IRestResponse<T>>(async (resolve, reject) => {
            const statusCode: number = res.message.statusCode;

            const response: IRestResponse<T> = {
                statusCode: statusCode,
                result: null,
                headers: {}
            };

            // not found leads to null obj returned
            if (statusCode == httpm.HttpCodes.NotFound) {
                resolve(response);
            }

            let obj: any;
            let contents: string;

            // get the result from the body
            try {
                contents = await res.readBody();
                if (contents && contents.length > 0) {
                    if (options && options.deserializeDates) {
                        obj = JSON.parse(contents, RestClient.dateTimeDeserializer);
                    } else {
                        obj = JSON.parse(contents);
                    }
                    if (options && options.responseProcessor) {
                        response.result = options.responseProcessor(obj);
                    }
                    else {
                        response.result = obj;
                    }
                }
                response.headers = res.message.headers;
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
                } else if (contents && contents.length > 0) {
                    // it may be the case that the exception is in the body message as string
                    msg = contents;
                } else {
                    msg = "Failed request: (" + statusCode + ")";
                }

                let err: Error = new Error(msg);

                // attach statusCode and body obj (if available) to the error object
                err['statusCode'] = statusCode;
                if (response.result) {
                    err['result'] = response.result;
                }

                reject(err);
            } else {
                resolve(response);
            }
        });
    }
}
