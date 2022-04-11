const { ethers, upgrades } = require("hardhat");

async function main() {
  const NFDDates = await ethers.getContractFactory("NFDDates");
  console.log("Deploying Pizza...");

  const nfdDates = await upgrades.deployProxy(NFDDates, ["NAMED"], {
    initializer: "initialize",
  });

  console.log("NFDDates deployed to: ", nfdDates.address);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
