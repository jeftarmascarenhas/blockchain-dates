/* eslint-disable no-unused-vars */
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

let ChronoBoxAdmin;
let chronoBoxAdmin;

let NFDDates;
let nfdDates;

describe("ChronoBoxAdmin(Proxy)", () => {
  beforeEach(async () => {
    ChronoBoxAdmin = await ethers.getContractFactory("ChronoBoxAdmin");
    chronoBoxAdmin = await upgrades.deployProxy(ChronoBoxAdmin, [], {
      initializer: "initialize",
    });

    NFDDates = await ethers.getContractFactory("NFDDates");
    nfdDates = await upgrades.deployProxy(NFDDates, [], {
      initializer: "initialize",
    });
  });

  it("should set approval and transfer to a new owner", async () => {
    const [owner, buyAddress] = await ethers.getSigners();

    const isApprovedForAllFirst = await nfdDates.isApprovedForAll(
      owner.address,
      chronoBoxAdmin.address
    );

    expect(isApprovedForAllFirst).to.equal(false);

    await nfdDates
      .connect(owner)
      .setApprovalForAll(chronoBoxAdmin.address, true);

    const isApprovedForAllSecond = await nfdDates.isApprovedForAll(
      owner.address,
      chronoBoxAdmin.address
    );

    expect(isApprovedForAllSecond).to.equal(true);
  });

  it("should set approval all and create new item", async () => {
    const [owner, buyAddress] = await ethers.getSigners();
    const coinPrice = ethers.utils.parseEther("1.0");
    const tokenId = 72134;
    const dollarPrice = 483;
    const nftAddress = nfdDates.address;

    await nfdDates
      .connect(owner)
      .setApprovalForAll(chronoBoxAdmin.address, true);

    const isApprovedForAllSecond = await nfdDates.isApprovedForAll(
      owner.address,
      chronoBoxAdmin.address
    );

    expect(isApprovedForAllSecond).to.equal(true);

    const tx = await chronoBoxAdmin.createMarketItem(
      nftAddress,
      tokenId,
      coinPrice,
      dollarPrice
    );
    const trx = await tx.wait();
    const block = await ethers.provider.getBlock(trx.blockNumber);

    // const etherscanProvider = new ethers.providers.EtherscanProvider();

    // console.log(await etherscanProvider.getHistory(owner.address));

    await expect(tx)
      .to.emit(chronoBoxAdmin, "MarketItemCreated")
      .withArgs(
        1,
        nfdDates.address,
        owner.address,
        tokenId,
        coinPrice,
        dollarPrice,
        false,
        block.timestamp
      );

    const itemCount = await chronoBoxAdmin.itemCount();
    expect(itemCount).to.equal(1);
  });

  it("should new buy", async () => {
    const [owner, buyAddress] = await ethers.getSigners();
    const price = ethers.utils.parseEther("0.7");
    const tokenId = 72134;
    const dollarPrice = 483;
    const nftAddress = nfdDates.address;

    await nfdDates.makeMintDate(price, tokenId, { value: price });

    await nfdDates
      .connect(owner)
      .setApprovalForAll(chronoBoxAdmin.address, true);

    const isApprovedForAllSecond = await nfdDates.isApprovedForAll(
      owner.address,
      chronoBoxAdmin.address
    );

    expect(isApprovedForAllSecond).to.equal(true);

    const coinPrice = ethers.utils.parseEther("1.7");

    const tx = await chronoBoxAdmin.createMarketItem(
      nftAddress,
      tokenId,
      coinPrice,
      dollarPrice
    );
    const trx = await tx.wait();
    const block = await ethers.provider.getBlock(trx.blockNumber);

    await expect(tx)
      .to.emit(chronoBoxAdmin, "MarketItemCreated")
      .withArgs(
        1,
        nfdDates.address,
        owner.address,
        tokenId,
        coinPrice,
        dollarPrice,
        false,
        block.timestamp
      );

    const itemCount = await chronoBoxAdmin.itemCount();
    // console.log(await chronoBoxAdmin.fetchMarketItems());

    expect(itemCount).to.equal(1);

    const value = ethers.utils.parseEther("1.2");
    await chronoBoxAdmin.connect(buyAddress).makeSell(1, { value });
    const filterFrom = chronoBoxAdmin.filters.MarketItemCreated(
      null,
      null,
      buyAddress.address
    );
    console.log(
      "Query",
      await chronoBoxAdmin.queryFilter(filterFrom, -10, "latest")
    );

    // console.log(await chronoBoxAdmin.fetchMarketItems());
    // console.log("getBalance: ", await chronoBoxAdmin.getBalance());
  });
});
