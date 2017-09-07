var saito = require('../saito');


function Miner(app) {

  if (!(this instanceof Miner)) {
    return new Miner(app);
  }

  this.app                      = app || {};


  this.mining                   = 0;    // do we mine blocks
  this.mining_timer             = null; // timer to loop creating block
  this.mining_speed             = 500;  // try to create a block every half-second
  this.currently_mining         = 0;    // timer to loop creating block

  return this;

}
module.exports = Miner;



//////////////////////
// Mining Functions //
//////////////////////
Miner.prototype.startMining = function startMining(blk) {

  if (this.currently_mining == 1) { clearInterval(this.mining_timer); }
  this.currently_mining = 1;

  miner_self = this;

  this.mining_timer = setInterval(function(){
    miner_self.attemptSolution(blk);
  }, this.mining_speed);

}
Miner.prototype.stopMining = function stopMining() {
  clearInterval(this.mining_timer);
}
Miner.prototype.attemptSolution = function attemptSolution(prevblock) {

  var ourPrivateKey = this.app.crypt.generateKeys();
  var ourPublicKey  = this.app.crypt.returnPublicKey(ourPrivateKey);

  decDifficulty = (prevblock.returnDifficulty() - Math.floor(prevblock.returnDifficulty()));
  decDifficulty = decDifficulty.toFixed(8);
  intDifficulty = Math.floor(prevblock.returnDifficulty());

  if (intDifficulty == 0) {
    h1 = h2 = 1;
  } else {
    h1 = ourPublicKey.slice((-1 * intDifficulty));
    h2 = prevblock.hash().slice((-1 * intDifficulty));
  }

  console.log(h1 + " -- " + h2 + " --- " + prevblock.hash());

  if (h1 == h2) {

    // we match the large number, try the smaller fraction
    // 
    // technically this is matching in the wrong direction
    // but that doesn't matter and it is probably more 
    // efficient anyway.
    //
    h3 = ourPublicKey.toString().toLowerCase()[ourPublicKey.length-1-intDifficulty];

    h4 = parseInt(h3,16);
    intTheDiff = Math.floor((decDifficulty * 10000));
    intModBase = 625;
    intResult  = Math.floor((intTheDiff/intModBase));

    if (h4 >= intResult) {

      this.stopMining();
 
      console.log("\nFOUND GOLDEN TICKET...\n");

      gt = new saito.goldenticket(this.app);
      gt.createSolution(prevblock, ourPublicKey, ourPrivateKey);

      // find the winners
      winners = gt.findWinners(prevblock);

      // create a transaction
      nt = this.app.wallet.createGoldenTransaction(winners, gt.solution);

      // add to mempool and broadcast
      this.app.blockchain.mempool.addTransaction(nt);
      this.app.network.propagateGoldenTicket(nt);

    }
  }
}






