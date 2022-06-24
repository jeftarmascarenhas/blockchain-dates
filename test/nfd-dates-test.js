/* eslint-disable no-unused-vars */
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

let NFDDates;
let nfdDates;

const baseTokenURI = "https://api.chronobox.com/";

describe("NFDDates(Proxy)", () => {
  beforeEach(async () => {
    NFDDates = await ethers.getContractFactory("NFDDates");
    nfdDates = await upgrades.deployProxy(NFDDates, [], {
      initializer: "initialize",
    });
  });

  it("should set pause contract", async () => {
    const coinPrice = ethers.utils.parseEther("1.0");
    await nfdDates.setPause();
    await expect(
      nfdDates.makeMintDate(coinPrice, 72134, { value: coinPrice })
    ).to.be.revertedWith("Pausable: paused");
  });

  it("should mint a date", async () => {
    const [_, account] = await ethers.getSigners();
    const coinPrice = ethers.utils.parseEther("1.0");
    const code = 72134;
    await nfdDates.connect(account).makeMintDate(coinPrice, code, {
      value: coinPrice,
    });

    const balance = await nfdDates.balanceOf(account.address);
    const totalSupply = (await nfdDates.totalSupply()).toNumber();
    const ownerOf = await nfdDates.ownerOf(code);
    const tokenURI = await nfdDates.tokenURI(code);

    expect(balance).to.equal(1);
    expect(totalSupply).to.equal(1);
    expect(tokenURI).to.equal(`${baseTokenURI}${code}`);
    expect(ownerOf).to.equal(account.address);
  });
});
