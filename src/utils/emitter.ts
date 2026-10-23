import { EventEmitter } from 'node:events';

type AppEvent = "logout"
    | "login"
    | "workspace_change"
    | "update-databases"
    | "update-session"
    | "update-model";

class AppEmitter {
    private readonly _emitter = new EventEmitter();

    emit(eventName: AppEvent, data?: any) {
        this._emitter.emit(eventName, data);
    }

    on(eventName: AppEvent, listener: (data: any) => void) {
        this._emitter.on(eventName, listener);
    }

    off(eventName: AppEvent, listener: (data: any) => void) {
        this._emitter.off(eventName, listener);
    }
}

export const emitEvent = new AppEmitter();