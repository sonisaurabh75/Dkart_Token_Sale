var DkartToken = artifacts.require("./DkartToken.sol");
var DkartTokenSale = artifacts.require("./DkartTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(DkartToken,1000000).then(function(){
    var tokenPrice = 1000000000000000; // 0.001 Ether
    return deployer.deploy(DkartTokenSale,DkartToken.address,tokenPrice);
  });
};
