pragma solidity ^0.4.23;
import "./DkartToken.sol";

contract DkartTokenSale {

    address admin;
    DkartToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer,uint256 _amount);

    constructor(DkartToken _tokenContract,uint256 _tokenPrice) public {
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
        admin = msg.sender;
    }

    function multiply(uint x,uint y) internal pure returns(uint z){
        require(y == 0 || (z = x * y) / y == x);
    }

    function buyTokens(uint256 _numberOfTokens) public payable {

        require(msg.value == multiply(_numberOfTokens,tokenPrice));
        require(tokenContract.balanceOf(this) >= _numberOfTokens);
        require(tokenContract.transfer(msg.sender,_numberOfTokens));

        tokensSold += _numberOfTokens;

        emit Sell(msg.sender,_numberOfTokens);
    }

    function endSale() public {

        require(msg.sender == admin);
        require(tokenContract.transfer(admin,tokenContract.balanceOf(this)));

        selfdestruct(admin);
    }
}