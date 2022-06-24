/* eslint-disable node/no-path-concat */
/* eslint-disable no-process-exit */
const { ethers, upgrades, artifacts } = require("hardhat");

async function main() {
  const ChronoBoxAdmin = await ethers.getContractFactory("ChronoBoxAdmin");
  console.log("Deploying ChronoBoxAdmin...");

  const chronoBoxAdmin = await upgrades.deployProxy(ChronoBoxAdmin, [], {
    initializer: "initialize",
  });

  console.log("ChronoBoxAdmin deployed to: ", chronoBoxAdmin.address);
  buildFiles(chronoBoxAdmin);
}

function buildFiles(chronoBoxAdmin) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../build/contracts";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/ChronoBoxAdmin-address.json",
    JSON.stringify({ ChronoBoxAdmin: chronoBoxAdmin.address }, undefined, 2)
  );

  const ChronoBoxAdminArtifact = artifacts.readArtifactSync("ChronoBoxAdmin");

  fs.writeFileSync(
    contractsDir + "/ChronoBoxAdmin.json",
    JSON.stringify(ChronoBoxAdminArtifact, null, 2)
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
