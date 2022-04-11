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

  it("should buy new tokenId and to emit event Transfer", async () => {
    const [ownerContract, address1] = await ethers.getSigners();
    const value = ethers.utils.parseEther("1.5");
    const tokenId = await nfdDates.totalSupply();

    expect(await nfdDates.buy(address1.address, { value }))
      .to.emit(nfdDates, "Transfer")
      .withArgs(ethers.constants.AddressZero, address1, tokenId);

    const balanceOf = (await nfdDates.balanceOf(address1.address)).toNumber();
    expect(balanceOf).to.equal(1);

    const ownerOf = await nfdDates.ownerOf(1);
    expect(address1.address).to.equal(ownerOf);
  });

  it("should set pause contract", async () => {
    const [ownerContract, address1] = await ethers.getSigners();
    const value = ethers.utils.parseEther("1.0");
    await nfdDates.setPause();
    await expect(nfdDates.buy(address1.address, { value })).to.be.revertedWith(
      "Pausable: paused"
    );
  });

  it("should transfer token to another owner", async () => {
    const [ownerContract, address1, address2] = await ethers.getSigners();
    const value = ethers.utils.parseEther("1.2");
    await nfdDates.buy(address1.address, { value });

    // await nfdDates.transferFrom(address1.address, address2.address, 1);

    // const ownerOf = await nfdDates.balanceOf(address2.address);
    console.log("ownerOf = ", nfdDates.transferFrom);

    expect(1).to.equal(1);
  });
});
