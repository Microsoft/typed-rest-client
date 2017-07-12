export interface IHeaders { [key: string]: any };

export interface IBasicCredentials {
    username: string;
    password: string;
}

export interface IRequestHandler {
    prepareRequest(options: any): void;
    canHandleAuthentication(res: IHttpResponse): boolean;
    handleAuthentication(httpClient, protocol, options, objs, finalCallback): void;
}

export interface IHttpResponse {
    statusCode?: number;
    headers: any;
}

export interface IRequestOptions {
    socketTimeout?: number,
    ignoreSslError?: boolean,
    proxy?: IProxyConfiguration
}

export interface IProxyConfiguration {
    proxyUrl: string;
    proxyUsername?: string;
    proxyPassword?: string;
    proxyBypassHosts?: string[];
}