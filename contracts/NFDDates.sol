//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract NFDDates is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ERC721Upgradeable
{
    using StringsUpgradeable for uint256;
    uint256 public totalSupply;
    string public baseTokenURI;

    function initialize() public initializer {
        __ERC721_init("NDF Dates", "NFDD");
        __Ownable_init();

        baseTokenURI = "https://api.chronobox.com/";
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function makeMintDate(uint256 coinPrice_, uint256 code_)
        public
        payable
        whenNotPaused
    {
        totalSupply += 1;
        require(
            coinPrice_ > 0 && msg.value == coinPrice_,
            "NFDD: Price is incorrect"
        );
        require(!_exists(code_), "NFDD: code exists");
        _safeMint(msg.sender, code_);
    }

    function setBaseTokenURI(string memory baseTokenURI_) public onlyOwner {
        baseTokenURI = baseTokenURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(uint256 code_)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(code_),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory _tokenURI = _baseURI();
        return
            bytes(_tokenURI).length > 0
                ? string(abi.encodePacked(_tokenURI, code_.toString()))
                : "";
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
