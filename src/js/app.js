App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("DkartTokenSale.json", function(dkartTokenSale) {
      App.contracts.DkartTokenSale = TruffleContract(dkartTokenSale);
      App.contracts.DkartTokenSale.setProvider(App.web3Provider);
      App.contracts.DkartTokenSale.deployed().then(function(dkartTokenSale) {
        console.log("Dkart Token Sale Address:", dkartTokenSale.address);
      });
    }).done(function() {
      $.getJSON("DkartToken.json", function(dkartToken) {
        App.contracts.DkartToken = TruffleContract(dkartToken);
        App.contracts.DkartToken.setProvider(App.web3Provider);
        App.contracts.DkartToken.deployed().then(function(dkartToken) {
          console.log("Dkart Token Address:", dkartToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.DkartTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('.accountAddress').html(account);
      }
    })

    // Load token sale contract
    App.contracts.DkartTokenSale.deployed().then(function(instance) {
      dkartTokenSaleInstance = instance;
      return dkartTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice.toNumber(), "ether")+' Ether');
      return dkartTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;

      if(progressPercent<=50){
        $('#progress1').css('width', progressPercent + '%');
      } else if(progressPercent>50 && progressPercent <=80){
        $('#progress2').css('width', progressPercent + '%');
      }else if(progressPercent>80 && progressPercent<100){
        $('#progress3').css('width', progressPercent + '%');
      }else if(progressPercent==100){
        $('#progress4').css('width', 100 + '%');
        $('.sale-end').html('Sale Ended');
      }

      // Load token contract
      App.contracts.DkartToken.deployed().then(function(instance) {
        dkartTokenInstance = instance;
        return dkartTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dkt-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.DkartTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
