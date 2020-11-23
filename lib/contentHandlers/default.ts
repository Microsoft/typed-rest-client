// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ifm = require('../Interfaces');

export class DefaultJsonHandler implements ifm.IContentHandler {
    constructor(private deserializeDates: boolean) {}

    private static dateTimeDeserializer(key: any, value: any): any {
        if (typeof value === 'string'){
            let a = new Date(value);
            if (!isNaN(a.valueOf())) {
                return a;
            }
        }

        return value;
    }

    canHandle(response: ifm.IHttpClientResponse): boolean {
        return response.message.headers["content-type"].indexOf('application/json') > -1;
    }

    handle(contents: string) {
        if (this.deserializeDates) {
            return JSON.parse(contents, DefaultJsonHandler.dateTimeDeserializer);
        } else {
            return JSON.parse(contents);
        }
    }
}
