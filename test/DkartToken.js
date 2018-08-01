var DkartToken = artifacts.require("./DkartToken.sol");

contract('DkartToken',function(accounts){
    var tokenInstance;

    it('Initializes the contract with correct values',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance=instance;
            return tokenInstance.name();
        }).then(function(name){
            assert.equal(name,"Dkart",'Correct Name');
            return tokenInstance.symbol();
        }).then(function(symbol){
            assert.equal(symbol,"DKT",'Correct Symbol');
        });
    })

    it('Sets Total Tokens upon deployment',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance=instance;
            return tokenInstance.total_Tokens();
        }).then(function(total_Tokens){
            assert.equal(total_Tokens.toNumber(),1000000,'sets total tokens to 1,000,000');
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function(adminBalance){
            assert.equal(adminBalance.toNumber(),1000000,'Tokens added in Admin account')
        });
    });

    it('Transfer Tokens',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance=instance;
            return tokenInstance.transfer.call(accounts[1],9999999999999999999);
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'error message must contain revert');
            return tokenInstance.transfer.call(accounts[1],250000,{from: accounts[0]})
        }).then(function(success){
            assert.equal(success,true,'it returns true');    
            return tokenInstance.transfer(accounts[1],250000,{from: accounts[0]});
        }).then(function(receipt){
            assert.equal(receipt.logs.length,1,'triggers one event');
            assert.equal(receipt.logs[0].event,'Transfer','must be Transfer Event');
            assert.equal(receipt.logs[0].args._from,accounts[0],'logs tokens transferred from');
            assert.equal(receipt.logs[0].args._to,accounts[1],'logs tokens transferred to');
            assert.equal(receipt.logs[0].args._value,250000,'logs transfer amount');
            return tokenInstance.balanceOf(accounts[1]);
        }).then(function(balance){
            assert.equal(balance.toNumber(),250000,'adds amount to receiving account');
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function(balance){
            assert.equal(balance.toNumber(),750000,'deducts amount from senders account');
        })
    });

    it('Approve Tokens',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance=instance;
            return tokenInstance.approve.call(accounts[1],100,{from: accounts[0]});
        }).then(function(success){
            assert.equal(success,true,'must returns true');
            return tokenInstance.approve(accounts[1],100);
        }).then(function(receipt){
            assert.equal(receipt.logs.length,1,'triggers one event');
            assert.equal(receipt.logs[0].event,'Approval','must be Approval Event');
            assert.equal(receipt.logs[0].args._owner,accounts[0],'logs tokens transferred from');
            assert.equal(receipt.logs[0].args._spender,accounts[1],'logs tokens transferred to');
            assert.equal(receipt.logs[0].args._value,100,'logs transfer amount');
            return tokenInstance.allowance(accounts[0],accounts[1]);
        }).then(function(allowance){
            assert.equal(allowance.toNumber(),100,'checks allowance');
        });
    });

    it('Delegated Token transfer',function(){
        return DkartToken.deployed().then(function(instance){
            tokenInstance=instance;
            fromAccount=accounts[2];
            toAccount=accounts[3];
            spendAccount=accounts[4];
            return tokenInstance.transfer(fromAccount,100,{form:accounts[0]});
        }).then(function(receipt){
            return tokenInstance.approve(spendAccount,10,{from: fromAccount});
        }).then(function(receipt){
            return tokenInstance.transferFrom(fromAccount,toAccount,9999,{from: spendAccount});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'Cannot Transfer Amount > Balance');
            return tokenInstance.transferFrom(fromAccount,toAccount,20,{from: spendAccount});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'Cannot Transfer Amount > Approved Amount');
            return tokenInstance.transferFrom.call(fromAccount,toAccount,10,{from: spendAccount});
        }).then(function(success){
            assert.equal(success,true);
            return tokenInstance.transferFrom(fromAccount,toAccount,10,{from: spendAccount});
        }).then(function(receipt){
            assert.equal(receipt.logs.length,1,'triggers one event');
            assert.equal(receipt.logs[0].event,'Transfer','must be Transfer Event');
            assert.equal(receipt.logs[0].args._from,fromAccount,'logs tokens transferred from');
            assert.equal(receipt.logs[0].args._to,toAccount,'logs tokens transferred to');
            assert.equal(receipt.logs[0].args._value,10,'logs transfer amount');
            return tokenInstance.balanceOf(fromAccount);
        }).then(function(balance){
            assert.equal(balance.toNumber(),90,'deducts amount from senders account');
            return tokenInstance.balanceOf(toAccount);
        }).then(function(balance){
            assert.equal(balance.toNumber(),10,'adds amount to receivers account');
            return tokenInstance.allowance(fromAccount,spendAccount);
        }).then(function(allowance){
            assert.equal(allowance,0,'deducts amount from allowance');
        });
    });

})