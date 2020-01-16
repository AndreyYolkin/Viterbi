let cytoscape = require('cytoscape');
let avsdf = require('cytoscape-avsdf');

cytoscape.use(avsdf);

export class Drawer {
    data = {};
    transitions;
    constraint;
    paths;
    metrics;
    isEncode;
    rows;
    decoded;
    defaultOptions = {
        padding: 50,
        ungrabifyWhileSimulating: false,
        animate: false
    };
    constructor(transitions, constraint, input, output, paths, metrics, isEncode) {
        this.transitions = transitions;
        this.constraint = constraint;
        this.input = input;
        this.output = output.padEnd(output.length + constraint - 1, "0");
        this.paths = paths;
        this.metrics = metrics.map(metric => metric.map(path => path < Number.MAX_SAFE_INTEGER ? path : "-"));
        this.isEncode = isEncode
        if (this.paths.length) {
            this.decoded = this.calc();
        }
        this.prepareData();
    }
    calc() {
        let decoded = [];
        let minPath = this.metrics[this.metrics.length - 1].indexOf(Math.min(...this.metrics[this.metrics.length - 1].filter(Number.isInteger)));
        for (let i = this.paths.length - 1; i >= 0; i--) {
            decoded.push(minPath);
            minPath = this.paths[i][minPath];
        }
        return decoded.reverse();
    }
    prepareData() {
        let r = [];
        this.transitions.map((_, i) => {
            r[i] = [];
            r[i].push(i.toString(2).padStart(this.constraint, "0"))
            r[i].push(((("0b" + i.toString(2)) >> 1) | ("0b0" << (this.constraint - 1))).toString(2).padStart(this.constraint, "0"));
            r[i].push(((("0b" + i.toString(2)) >> 1) | ("0b1" << (this.constraint - 1))).toString(2).padStart(this.constraint, "0"));
        });

        const nodesauto = r.map((el, i) => { return (i % 2) ? { data: { id: "n" + el[0].slice(0, -1), label: el[0].slice(0, -1) } } : {} }).filter(value => Object.keys(value).length !== 0);

        const edgesauto = r.flatMap((el, i) => {
            return (i % 2) ? [
                { data: { source: "n" + el[0].slice(0, -1), target: "n" + el[1].slice(0, -1), label: this.transitions[("0b" + el[1]) * 1], style: "dashed" } },
                { data: { source: "n" + el[0].slice(0, -1), target: "n" + el[2].slice(0, -1), label: this.transitions[("0b" + el[2]) * 1], style: "solid" } }
            ] : {}
        }).filter(value => Object.keys(value).length !== 0);
        if (this.paths.length) {
            let nodesgrid = [],
                edgesgrid = [];
            const rows = this.paths[0].length,
                cols = this.paths.length + 1;
            this.rows = rows;
            let lastindex = 0;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const mod = (i * rows + j) % cols,
                        div = ~~((i * rows + j) / cols)
                    nodesgrid.push({
                        data: {
                            id: "n" + (rows * mod + div),
                            label: this.metrics[mod][div],
                        },
                        grabbable: false,
                        classes: this.metrics[mod][div] !== "-" ? this.metrics[mod][div] === Math.min(...this.metrics[mod].filter(Number.isInteger)) ? "best" : null : "unused"
                    });
                    if (mod > 0 && this.metrics[mod][div] !== "-") {
                        const target = (rows * mod + div),
                            source = (rows * (mod - 1) + this.paths[mod - 1][div]),
                            bit = ((target - source - rows) >= 0 ? target % rows ? "1" : "0" : "0");
                        lastindex = this.decoded[mod - 1] === div ? true : false;
                        edgesgrid.push({
                            data: {
                                target: "n" + target,
                                source: "n" + source
                            },
                            classes: [bit === "1" ? "up" : "down",
                            lastindex ? "path" : "nepath"
                            ]
                        });
                    }
                }
            }
            this.data.grid = [...nodesgrid, ...edgesgrid];
        }
        this.data.auto = [...nodesauto, ...edgesauto];
    }
    run(auto, grid) {
        this._draw(document.getElementById(auto), document.getElementById(grid));
    }
    _draw(auto, grid) {
        if (auto !== null) {
            cytoscape({
                elements: this.data.auto,
                container: auto,
                layout: {
                    name: 'avsdf',
                    ...this.defaultOptions,
                    nodeSeparation: 120
                },
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#bf9',
                            "border-width": "1px",
                            "border-color": "#888",
                            'label': 'data(label)',
                            "color": "#111",
                            "text-valign": "center",
                            "text-halign": "center",
                            "font-size": "12px"
                        }
                    },
                    {
                        selector: "edge",
                        style: {
                            "curve-style": "unbundled-bezier",
                            "color": "#111",
                            "target-arrow-shape": "triangle",
                            'line-style': 'data(style)',
                            "width": 1,
                            "control-point-distances": 20,
                            "control-point-weights": 0.8,
                            'label': 'data(label)',
                            "font-size": "12px"
                        }
                    }
                ]
            });
        }
        if (grid !== null) {
            cytoscape({
                elements: this.data.grid,
                container: grid,
                layout: {
                    name: "grid",
                    rows: this.rows,
                    ...this.defaultOptions,
                    nodeSeparation: 300
                },
                style: [
                    {
                        selector: "node",
                        style: {
                            "background-color": "#17a2b8",
                            "border-width": "1px",
                            "border-color": "#888",
                            "label": "data(label)",
                            "color": "#fff",
                            "text-valign": "center",
                            "text-halign": "center",
                            "font-size": "16px"
                        }
                    },
                    {
                        selector: "node.best",
                        style: {
                            "background-color": "#007bff",
                        }
                    },
                    {
                        selector: "node.unused",
                        style: {
                            "background-color": "#f8f9fa",
                            "border-width": "0px",
                        }
                    },
                    {
                        selector: "edge",
                        style: {
                            color: "#222",
                            "target-arrow-shape": "triangle",
                            "width": 3,
                            "control-point-distances": 20,
                            "control-point-weights": 0.8,
                        }
                    },
                    {
                        selector: "edge.down",
                        style: {
                            'line-style': "dashed",
                        }
                    },
                    {
                        selector: "edge.path",
                        style: {
                            'line-color': "#dc3545",
                            'width': 4
                        }
                    }
                ]
            });
        }
    }
    download(dataurl, filename) {
        var a = document.createElement("a");
        a.href = dataurl;
        a.setAttribute("download", filename);
        a.click();
    }
    getimage() {
        let grid = document.createElement("div");

        document.body.append(grid);
        grid.style.position = "absolute";
        grid.style.visibility = "hidden";
        grid.style.width = "1000px";
        grid.style.height = "2000px";
        this._draw(null, grid);
        setTimeout(() => {
            this.download(grid.querySelectorAll("canvas")[2].toDataURL(), "grid.png")
            grid.remove();
        }, 0)
    }
}