import { Viterbi } from "./Viterbi";
import { expect } from "chai";
import "mocha";

describe("Viterbi", () => {
  it("Encode text", () => {
    const viterbi = new Viterbi("11 10", "3");
    return viterbi.encode("101010").then((result) => {
      expect(result).to.equal('1110111011100000');
    })
  })
  it("Decode text", () => {
    const viterbi = new Viterbi("1101 1011", "5");
    return viterbi.decode("1110011100110111010101110000").then((result) => {
      console.log(result);
      expect(result).to.equal('100001101000001000011010');
    })
  })
})