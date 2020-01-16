import Observable from "./Observable";

export class Viterbi extends Observable {
    polynomials;
    constraint;
    transitions = [];
    paths = [];
    metrics = [];
    soft = true;
    constructor(polynomynals, constraint, style) {
        super();
        try {
            constraint = parseInt(constraint);
            polynomynals = polynomynals.trim().split(" ").filter(el => el.length);
            if (Number.isInteger(constraint) && constraint > 0) {
                this.constraint = constraint;
            }
            else {
                throw Error("Ограничение должно быть натуральным числом")
            }
            if (polynomynals.length) {
                polynomynals.forEach(poly => {
                    if (("0b" + poly) > (1 << constraint)) {
                        throw Error("Количество хранимых ячеек меньше необходимого количества")
                    }
                });
                this.polynomials = polynomynals;
            }
            else throw Error("Введите образуюшие полиномы")
            if (typeof style !== "undefined" && style !== "hard" && style !== "soft") {
                throw Error("Доступные режимы: soft(по умолчанию) и hard(работает в целых числах)")
            }
            else if (style === "hard") {
                this.soft = false;
            }
        }
        catch (err) {
            return err;
        }
        this.log = this.log.bind(this);
        this.get = this.get.bind(this);
        this.encode = this.encode.bind(this);
        this.decode = this.decode.bind(this);

        this.createStateTransitions();
    }

    _getCode(state, input) {
        return this.transitions[state | (input << (this.constraint - 1))]
    }

    _calculateDistance(x, y) {
        if (this.soft) {
            return this._euclideanDistance(x, y)
        }
        return this._hamingDistance(x, y)
    }

    _hamingDistance(x, y) {
        if (Array.isArray(x)) {
            x = x.map(Math.round).join("")
        }
        if (Array.isArray(y)) {
            y = y.map(Math.round).join("")
        }
        return (`0b${x}` ^ `0b${y}`).toString(2).split("").reduce((a, i) => a + (+i), 0)
    }

    _euclideanDistance(x, y) {
        let sum = 0;
        if (typeof x === "string") x = x.split("");
        x.map((_, i) => sum += (x[i] - y[i]) ** 2);
        return sum ** 0.5;
    }

    _getNextState(currentState, input) {
        return (currentState >> 1) | (("0b" + input) << (this.constraint - 2));
    }

    _calculateBranch(bits, source, destination) {
        let res = this._calculateDistance(bits, this._getCode(source, destination >> (this.constraint - 2)));
        return res
    }

    _calculatePath(bits, pathMetric, state) {
        const s = (state & ((1 << (this.constraint - 2)) - 1)) << 1;
        const source = [s | 0, s | 1],
            sourcePathMetric = [pathMetric[source[0]], pathMetric[source[1]]]
        if (sourcePathMetric[0] <= Number.MAX_SAFE_INTEGER) {
            sourcePathMetric[0] += this._calculateBranch(bits, source[0], state)
        }
        if (sourcePathMetric[1] <= Number.MAX_SAFE_INTEGER) {
            sourcePathMetric[1] += this._calculateBranch(bits, source[1], state)
        }
        return sourcePathMetric[0] <= sourcePathMetric[1] ? [sourcePathMetric[0], source[0]] : [sourcePathMetric[1], source[1]];
    }

    _pushColumn(bits, pathMetric) {
        let newPathMetrics = [],
            newPathColumn = [];
        pathMetric.map((_, i) => {
            const arr = this._calculatePath(bits, pathMetric, i);
            newPathMetrics[i] = arr[0];
            newPathColumn[i] = arr[1];
        })
        this.paths.push(newPathColumn);
        return newPathMetrics;
    }

    createStateTransitions() {
        let transitions = [...new Array(1 << this.constraint).fill("")];
        for (let i = 0; i < transitions.length; i++) {
            this.polynomials.map((polynomial) => {
                polynomial = "0b" + polynomial.padEnd(this.constraint, "0");
                let input = i;
                let transition = 0;
                for (let k = 0; k < this.constraint; k++) {
                    transition ^= (input & 1) & (polynomial & 1);
                    polynomial >>= 1;
                    input >>= 1;
                }
                transitions[i] += transition;
            })
        }
        this.transitions = transitions;
    }

    encode(input) {
        return new Promise((resolve, reject) => {
            if (input <= 0) reject(Error("Код введён неверно"));
            let encoded = "",
                state = 0;
            input.split("").map(c => {
                if (c == '0' || c == '1') {
                    encoded += this._getCode(state, +c);
                    state = this._getNextState(state, +c);
                }
                else {
                    reject(Error("check the input"));
                }
            })
            for (let i = 0; i < this.constraint - 1; i++) {
                encoded += this._getCode(state, 0);
                state = this._getNextState(state, 0);
            }
            resolve(encoded);
        })
    }

    decode(input) {
        return new Promise((resolve, reject) => {
            if (input <= 0) reject(Error("Код введён неверно"));
            let pathMetric = [...new Array(1 << (this.constraint - 1))].fill(Number.MAX_SAFE_INTEGER);
            pathMetric[0] = 0;
            this.metrics = [];
            this.paths = [];
            this.metrics.push(pathMetric);
            if (typeof input === "string") {
                for (let i = 0; i < input.length; i += this.polynomials.length) {
                    let bits = input.substr(i, this.polynomials.length);
                    bits.padEnd(this.polynomials.length, "0");
                    pathMetric = this._pushColumn(bits, pathMetric);
                    if (i > input.length - this.constraint * this.polynomials.length) {
                        pathMetric.fill(Number.MAX_SAFE_INTEGER, pathMetric.length / 2);
                    }
                    this.metrics.push(pathMetric);
                }
            }
            else {
                for (let i = 0; i < input.length; i += this.polynomials.length) {
                    let bits = input.slice(i, i + this.polynomials.length);
                    while (bits.length < this.polynomials.length) {
                        bits.push(0);
                    }
                    pathMetric = this._pushColumn(bits, pathMetric);
                    if (i > input.length - this.constraint * this.polynomials.length) {
                        pathMetric.fill(Number.MAX_SAFE_INTEGER, pathMetric.length / 2);
                    }
                    this.metrics.push(pathMetric);
                }
            }
            let decoded = "";
            console.log(this.metrics);
            let minPath = pathMetric.indexOf(Math.min(...pathMetric));
            for (let i = this.paths.length - 1; i >= 0; i--) {
                decoded += (minPath >> (this.constraint - 2) ? "1" : "0");
                minPath = this.paths[i][minPath];
            }
            decoded = decoded.split("").reverse().slice(0, 1 - this.constraint).join("");
            resolve(decoded);
        })
    }

    log() {
        console.log(this);
    }
    get() {
        return this;
    }
}

export default Viterbi