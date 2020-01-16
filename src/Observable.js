class Observable {
    constructor() {
        this._observers = {};
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.emit = this.emit.bind(this);
    }
    getObservers(type) {
        return type ? this._observers[type] : this._observers;
    }
    subscribe(type, callback) {
        if (!this._observers[type])
            this._observers[type] = [];
        this._observers[type].push(callback);
    }
    unsubscribe(type, callback) {
        this._observers[type] = this._observers[type].filter(el => el !== callback);
    }
    emit(type, data) {
        if (this._observers.hasOwnProperty(type)) {
            this._observers[type].forEach(observer => observer(data));
        }
    }
}
export default Observable;
