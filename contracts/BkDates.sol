//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract BKDates is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    string private _name;
    string private _symbol;

    function initialize(string memory _initName, string memory _initSymbol)
        public
        initializer
    {
        _name = _initName;
        _symbol = _initSymbol;
        __Ownable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }
}
