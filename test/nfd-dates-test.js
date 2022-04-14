/* eslint-disable no-unused-vars */
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

let NFDDates;
let nfdDates;

const datesBlockMocked = {
  name: "DatesBlock",
  symbol: "DB",
};

describe("NFDDates(Proxy)", () => {
  beforeEach(async () => {
    NFDDates = await ethers.getContractFactory("NFDDates");
    nfdDates = await upgrades.deployProxy(
      NFDDates,
      [datesBlockMocked.name, datesBlockMocked.symbol],
      {
        initializer: "initialize",
      }
    );
  });

  it("should retrieve initialized contract name", async () => {
    const name = (await nfdDates.name()).toString();

    expect(name).to.equal(datesBlockMocked.name);
  });

  it("should retrieve initialized contract symbol", async () => {
    const symbol = (await nfdDates.symbol()).toString();
    expect(symbol).to.equal(datesBlockMocked.symbol);
  });

  it("should set pause contract", async () => {
    const [_, address1] = await ethers.getSigners();
    const value = ethers.utils.parseEther("1.0");
    await nfdDates.setPause();
    await expect(
      nfdDates.connect(address1).createMarketSale(value, { value })
    ).to.be.revertedWith("Pausable: paused");
  });

  it("should buy new tokenId and to emit event Transfer", async () => {
    const [_, buyerAddress] = await ethers.getSigners();
    const value = ethers.utils.parseEther("1.5");

    const mintNewToken = nfdDates
      .connect(buyerAddress)
      .createMarketSale(value, { value });

    await expect(mintNewToken)
      .to.emit(nfdDates, "Transfer")
      .withArgs(ethers.constants.AddressZero, buyerAddress.address, 1);

    await expect(mintNewToken)
      .to.emit(nfdDates, "MarketItemCreated")
      .withArgs(1, buyerAddress.address, buyerAddress.address, value, false);

    const balanceOf = (
      await nfdDates.balanceOf(buyerAddress.address)
    ).toNumber();

    expect(balanceOf).to.equal(1);

    const ownerOf = await nfdDates.ownerOf(1);
    expect(buyerAddress.address).to.equal(ownerOf);

    const contractBalance = await nfdDates.getBalance();
    expect(value).to.equal(contractBalance);
  });

  it("should set the specific tokenId to resellToken", async () => {
    const [buyerAddress, sellerAddress] = await ethers.getSigners();
    const value = ethers.utils.parseEther("1");
    const tokenId = 1;

    await nfdDates.connect(sellerAddress).createMarketSale(value, { value });

    const resellToken = nfdDates
      .connect(sellerAddress)
      .resellToken(value, tokenId);

    await expect(resellToken)
      .to.emit(nfdDates, "Transfer")
      .withArgs(sellerAddress.address, nfdDates.address, 1);

    await expect(resellToken)
      .to.emit(nfdDates, "MarketItemCreated")
      .withArgs(1, sellerAddress.address, nfdDates.address, value, true);
  });

  it("should transfer token to another owner", async () => {
    const [sellerAddress, buyerAddress] = await ethers.getSigners();
    const value = ethers.utils.parseEther("0.5");
    const tokenId = 1;

    await nfdDates.connect(sellerAddress).createMarketSale(value, { value });

    const sellerBalanceStart = (
      await nfdDates.balanceOf(sellerAddress.address)
    ).toNumber();
    expect(sellerBalanceStart).to.equal(1);

    const newValue = ethers.utils.parseEther("1.5");

    const resellToken = nfdDates
      .connect(sellerAddress)
      .resellToken(newValue, tokenId);

    await expect(resellToken)
      .to.emit(nfdDates, "Transfer")
      .withArgs(sellerAddress.address, nfdDates.address, tokenId);

    await expect(resellToken)
      .to.emit(nfdDates, "MarketItemCreated")
      .withArgs(1, sellerAddress.address, nfdDates.address, newValue, true);

    const percentagePlatform = 5;

    await nfdDates
      .connect(buyerAddress)
      .createResellMarketSale(percentagePlatform, tokenId, {
        value: newValue,
      });

    const sellerBalance = (
      await nfdDates.balanceOf(sellerAddress.address)
    ).toNumber();
    expect(sellerBalance).to.equal(0);

    const buyerBalance = (
      await nfdDates.balanceOf(buyerAddress.address)
    ).toNumber();
    expect(buyerBalance).to.equal(1);
  });

  it("should send all balance when withDraw it is called ", async () => {});
});
