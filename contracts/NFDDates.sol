//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFDDates is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ERC721Upgradeable
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    mapping(uint256 => MarketItem) private idToMarketItem;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool forSale;
    }

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool forSale
    );

    function initialize() public initializer {
        __ERC721_init("NDF Dates", "NFDD");
        __Ownable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function createMarketItem(uint256 tokenId_, uint256 price_) private {
        idToMarketItem[tokenId_] = MarketItem(
            tokenId_,
            payable(msg.sender),
            payable(msg.sender),
            price_,
            false
        );
        emit MarketItemCreated(
            tokenId_,
            msg.sender,
            payable(msg.sender),
            price_,
            false
        );
    }

    function createToken(uint256 price_) private returns (uint256) {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _safeMint(msg.sender, tokenId);
        createMarketItem(tokenId, price_);
        return tokenId;
    }

    function createMarketSale(uint256 price_) public payable whenNotPaused {
        require(
            price_ > 0 && msg.value == price_,
            "Price must be at least 1 wei"
        );
        createToken(price_);
        _itemsSold.increment();
    }

    function createResellMarketSale(uint256 percentage_, uint256 tokenId_)
        public
        payable
        whenNotPaused
    {
        uint256 itemPrice = idToMarketItem[tokenId_].price;
        require(
            msg.value > 0 && msg.value >= itemPrice,
            "NFDDates: Price is not correct"
        );
        require(
            idToMarketItem[tokenId_].seller != msg.sender,
            "NFDDates: You are the owner"
        );

        uint256 platformValue = (msg.value * percentage_) / 100;
        uint256 sellValue = msg.value - platformValue;

        address payable seller = idToMarketItem[tokenId_].seller;

        _transfer(address(this), msg.sender, tokenId_);
        idToMarketItem[tokenId_].price = msg.value;
        idToMarketItem[tokenId_].forSale = false;
        idToMarketItem[tokenId_].seller = payable(msg.sender);
        idToMarketItem[tokenId_].owner = payable(msg.sender);
        emit MarketItemCreated(
            tokenId_,
            payable(msg.sender),
            payable(msg.sender),
            idToMarketItem[tokenId_].price,
            false
        );
        payable(seller).transfer(sellValue);
    }

    function updateMakertItem(uint256 price_, uint256 tokenId_) private {
        idToMarketItem[tokenId_].forSale = true;
        idToMarketItem[tokenId_].price = price_;
        idToMarketItem[tokenId_].seller = payable(msg.sender);
        idToMarketItem[tokenId_].owner = payable(address(this));

        // _itemsSold.decrement();

        emit MarketItemCreated(
            tokenId_,
            payable(msg.sender),
            payable(address(this)),
            price_,
            true
        );
    }

    function resellToken(uint256 price_, uint256 tokenId_)
        public
        whenNotPaused
    {
        require(
            idToMarketItem[tokenId_].seller == msg.sender,
            "NFDDates: Only owner of token"
        );

        require(
            idToMarketItem[tokenId_].forSale == false,
            "NFDDates: Item is for sale"
        );

        updateMakertItem(price_, tokenId_);

        _transfer(msg.sender, address(this), tokenId_);
    }

    function setPause() public onlyOwner {
        _pause();
    }

    function getBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function setUnPause() public onlyOwner {
        _unpause();
    }

    function withdraw() public payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "NFDDates: No ether left to withdraw");

        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "NFDDates: Transfer failed.");
    }
}
