//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ChronoBoxAdmin is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    string public name;
    uint256 public feePercent;
    uint256 public itemCount;
    uint256 public itemSold;

    mapping(uint256 => MarketItem) public _marketItems;

    struct MarketItem {
        uint256 itemId;
        IERC721 nftAddress;
        address payable owner;
        uint256 tokenId;
        uint256 coinPrice;
        bool sold;
        uint256 dollarPrice;
        uint256 timestamp;
    }

    event MarketItemCreated(
        uint256 itemId,
        address indexed nftAddress,
        address indexed owner,
        uint256 tokenId,
        uint256 coinPrice,
        uint256 dollarPrice,
        bool sold,
        uint256 timestamp
    );

    event MakeSell(
        uint256 itemId,
        address indexed nftAddress,
        address indexed owner,
        uint256 tokenId,
        address indexed buyer,
        uint256 platformValue,
        uint256 value
    );

    function initialize() public initializer {
        __Ownable_init();
        name = "Chrono Box Admin";
        feePercent = 5;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function createMarketItem(
        IERC721 nftAddress_,
        uint256 tokenId_,
        uint256 price_,
        uint256 dollarPrice_
    ) external {
        require(
            _marketItems[itemCount].nftAddress != nftAddress_ &&
                _marketItems[itemCount].tokenId != tokenId_,
            "token exists"
        );
        itemCount++;
        uint256 timestamp = block.timestamp;

        _marketItems[itemCount] = MarketItem(
            itemCount,
            nftAddress_,
            payable(msg.sender),
            tokenId_,
            price_,
            false,
            dollarPrice_,
            timestamp
        );

        emit MarketItemCreated(
            itemCount,
            address(nftAddress_),
            payable(msg.sender),
            tokenId_,
            price_,
            dollarPrice_,
            false,
            timestamp
        );
    }

    function makeSell(uint256 itemId_)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        uint256 platformValue = (msg.value * feePercent) / 100;
        uint256 sellValue = msg.value - platformValue;

        MarketItem storage item = _marketItems[itemId_];
        item.sold = true;

        IERC721(item.nftAddress).transferFrom(
            item.owner,
            msg.sender,
            item.tokenId
        );

        payable(msg.sender).transfer(sellValue);

        emit MakeSell(
            item.itemId,
            address(item.nftAddress),
            item.owner,
            item.tokenId,
            msg.sender,
            platformValue,
            sellValue
        );
    }

    function fetchAllItems() external view returns (MarketItem[] memory) {
        uint256 currentIndex;

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            uint256 currentId = i + 1;
            MarketItem storage currentItem = _marketItems[currentId];
            items[currentIndex] = currentItem;
            currentIndex += 1;
        }
        return items;
    }

    function fetchMarketItems() external view returns (MarketItem[] memory) {
        uint256 currentIndex;

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            if (!_marketItems[i + 1].sold) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = _marketItems[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function getTotalPrice(uint256 itemId_) public view returns (uint256) {
        return ((_marketItems[itemId_].coinPrice * (100 + feePercent)) / 100);
    }

    function getBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function setPause() public onlyOwner {
        _pause();
    }

    function setUnPause() public onlyOwner {
        _unpause();
    }

    function withdraw() public payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "ChronoBox: No ether left to withdraw");

        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "ChronoBox: Transfer failed.");
    }
}
