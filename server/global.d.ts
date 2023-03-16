// declare type Network = {
//   readonly name: string;
// }

declare global {
    /*~ Here, declare things that go in the global namespace, or augment
     *~ existing declarations in the global namespace
     */
  type Network = {
    readonly name: string;
  }
}
export {}
