import Chart from 'chart.js';

export class Test {
  viterbi;
  constructor(viterbi) {
    this.viterbi = viterbi;
  }
  _randint(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
  }

  _01to11(array) {
    return array.map(a => a * 2 - 1);
  }

  _11to01(array) {
    return array.map(a => (a + 1) / 2)
  }

  _getsigma(x) {
    console.log((1 / (2 * (1 / this.viterbi.polynomials.length) * 10 ** (x / 10))) ** (1 / 2));
    return (1 / (2 * (1 / this.viterbi.polynomials.length) * 10 ** (x / 10))) ** (1 / 2);
  }

  _gaussian(mean, stdev) {
    let y2;
    let use_last = false;
    return function () {
      let y1;
      if (use_last) {
        y1 = y2;
        use_last = false;
      }
      else {
        let x1, x2, w;
        do {
          x1 = 2.0 * Math.random() - 1.0;
          x2 = 2.0 * Math.random() - 1.0;
          w = x1 * x1 + x2 * x2;
        } while (w >= 1.0);
        w = Math.sqrt((-2.0 * Math.log(w)) / w);
        y1 = x1 * w;
        y2 = x2 * w;
        use_last = true;
      }
      const retval = mean + stdev * y1;
      return retval;
    }
  }

  runTests(count) {
    let bitsErr = [];
    let wordsErr = [];
    const waits = [];

    function calc(x) {
      return new Promise(resolve => {
        bitsErr[x] = [];
        wordsErr[x] = [];
        const sigma = this._getsigma(x);
        const gausian = this._gaussian(0, sigma);

        let arr = [];
        for (let j = 0; j < count; j++) {
          let seed = this._randint(2 ** (this.viterbi.constraint + 2), 2 ** (this.viterbi.constraint + 16)).toString(2);
          arr.push(seed);
        }
        var promises = arr.map((seed) => this.viterbi.encode(seed).then(result => {
          let u = result.split("");
          u = this._01to11(u);
          u = u.map(a => a + gausian())
          u = this._11to01(u)
          this.viterbi.decode(u).then((decoded) => {
            bitsErr[x].push((decoded ^ seed).toString(2).replace(/0/g,'').length/seed.toString(2).length);
            wordsErr[x].push(+(decoded == seed));
          })
        }));
        Promise.all(promises).then(() => {
          resolve();
        })
      })
    }
    calc = calc.bind(this);

    for (let x = 0; x < 13; x++) {
      waits.push(calc(x));
    }
    Promise.all(waits).then(() => {
      var myLineChart = new Chart($("#testresult canvas"), {
        type: 'line',
        data: {
          labels: [...new Array(13).fill(0)].map((_, i) => i),
          datasets: [{
            borderColor: "#eaa",
            label: "BER",
            fill: false,
            data: bitsErr.map(x => x.reduce((a, i) => a + i, 0) / count)
          },{
            borderColor: "#aee",
            label: "FER",
            fill: false,
            data: wordsErr.map(x => 1 - x.reduce((a, i) => a + i, 0) / count),
          }]
        },
        options: {
          responsive: true,
          scales: {
            xAxes: [{
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Eb/No'
              }
            }],
            yAxes: [{
              display: true,
              type: 'logarithmic',
              scaleLabel: {
                display: false,
                labelString: 'BER',
              },
            }]
          }
        }
      })
    })
  }
}

export default Test