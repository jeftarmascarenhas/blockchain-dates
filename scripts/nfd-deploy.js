/* eslint-disable node/no-path-concat */
/* eslint-disable no-process-exit */
const { ethers, upgrades, artifacts } = require("hardhat");

async function main() {
  const NFDDates = await ethers.getContractFactory("NFDDates");
  console.log("Deploying NFDDates...");

  const nfdDates = await upgrades.deployProxy(NFDDates, [], {
    initializer: "initialize",
  });

  console.log("NFDDates deployed to: ", nfdDates.address);
  buildFiles(nfdDates);
}

function buildFiles(nfdDates) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../build/contracts";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/NFDDates-address.json",
    JSON.stringify({ NFDDates: nfdDates.address }, undefined, 2)
  );

  const NFDDatesArtifact = artifacts.readArtifactSync("NFDDates");

  fs.writeFileSync(
    contractsDir + "/NFDDates.json",
    JSON.stringify(NFDDatesArtifact, null, 2)
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
