var DkartToken = artifacts.require("./DkartToken.sol");
var DkartTokenSale = artifacts.require("./DkartTokenSale.sol");

contract(DkartTokenSale,function(accounts){
    var tokenSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var numberOfTokens;
    var tokensAvailable = 750000;
    var tokenPrice = 1000000000000000; //in wei

    it('Initializes the contract with correct values',function(){
        return DkartTokenSale.deployed().then(function(instance){
            tokenSaleInstance = instance;
            return tokenSaleInstance.address
        }).then(function(address){
            assert.notEqual(address,0x0,'Correct Address');
            return tokenSaleInstance.tokenContract();
        }).then(function(address){
            assert.notEqual(address,0x0,'Correct Token Contract Address');
            return tokenSaleInstance.tokenPrice();
        }).then(function(price){
            assert.equal(price,tokenPrice,'Token Price Is Correct');
        });
    });

    it('Buying Tokens',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance = instance;
            return DkartTokenSale.deployed();
        }).then(function(instance){
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address,tokensAvailable,{from: admin});
        }).then(function(receipt){
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens,{from: buyer,value: numberOfTokens * tokenPrice});
        }).then(function(receipt){
            assert.equal(receipt.logs.length,1,'triggers one event');
            assert.equal(receipt.logs[0].event,'Sell','must be Sell Event');
            assert.equal(receipt.logs[0].args._buyer,buyer,'logs account that purchased tokens');
            assert.equal(receipt.logs[0].args._amount,numberOfTokens,'logs Number Of Tokens Purchased');
            return tokenSaleInstance.tokensSold();
        }).then(function(amount){
            assert.equal(amount.toNumber(),numberOfTokens,'Number Of Tokens Sold');
            return tokenInstance.balanceOf(buyer);
        }).then(function(balance){
            assert.equal(balance.toNumber(),numberOfTokens);    
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function(balance){
            assert.equal(balance.toNumber(),tokensAvailable - numberOfTokens);    
            return tokenSaleInstance.buyTokens(numberOfTokens,{from: buyer,value: 1});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'MSG.Value Must Equal To Number Of Tokens In WEI');
            return tokenSaleInstance.buyTokens(800000,{from: buyer,value: numberOfTokens * tokenPrice});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'Cannot Purchase More Tokens Than Available');
        });
    });

    it('Ends Token Sale',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance = instance ;
            return DkartTokenSale.deployed();
        }).then(function(instance){
            tokenSaleInstance = instance;
            return tokenSaleInstance.endSale({from:buyer});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0, 'Only Admin Can End Sale');
            return tokenSaleInstance.endSale({from: admin});
        }).then(function(receipt){
            return tokenInstance.balanceOf(admin);
        }).then(function(balance){
            assert.equal(balance.toNumber(),999990,'Returns All Unsold Dapp Tokens To Admin');
            balance = web3.eth.getBalance(tokenSaleInstance.address)
            assert.equal(balance.toNumber(), 0);
        });
    });

});

