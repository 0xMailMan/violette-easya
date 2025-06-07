import express from 'express';
declare class VioletteBackendServer {
    private app;
    private server;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    start(port?: number): Promise<void>;
    private gracefulShutdown;
    getApp(): express.Application;
}
declare const server: VioletteBackendServer;
export default server;
export { VioletteBackendServer };
//# sourceMappingURL=server.d.ts.map