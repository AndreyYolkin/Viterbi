import * as galois from '@guildofweavers/galois';

export class Reed {
  field;
  nsym;
  g;

  constructor(size, nsym) {
    size = BigInt(size);
    if (nsym !== undefined) {
      nsym = BigInt(nsym);
    }
    this.field = galois.createPrimeField(size, true);
    this.nsym = nsym;
  }
  generatePoly(n, k, b) {
    n = BigInt(n);
    k = BigInt(k);
    if (b !== undefined) {
      b = BigInt(b);
    }
    else {
      b = 1n;
    }
    let g = this.field.newVectorFrom([1n]);
    for (let i = b; i < n - k + 1n; i++) {
      console.log(g);
      g = this.field.mulPolys(g, this.field.newVectorFrom([1n, (2n ** i)]))
    }
    let h = this.field.newVectorFrom([1n]);
    for (let i = n - k + 1n; i < n + 1n; i++) {
      h = this.field.mulPolys(h, this.field.newVectorFrom([1n, (2n ** i)]))
    }
    this.g = g;
  }
  encode(message, nsym) {
    console.log(nsym);
    if (nsym === undefined) {
      if (this.nsym === undefined) {
        return new Error("")
      }
      nsym = this.nsym;
    }

  }
}

const reed = new Reed(255n);
reed.generatePoly(15n, 9n);