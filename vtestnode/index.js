/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

"use strict";
const shim = require("fabric-shim");

const ClientIdentity = require("fabric-shim").ClientIdentity;

async function allowAppAccess(stub) {
  let cid = new ClientIdentity(stub); // "stub" is the ChaincodeStub object passed to Init() and Invoke() methods
  let [AppId, Version] = process.env.CORE_CHAINCODE_ID_NAME.split(":");
  if (!cid.assertAttributeValue("AppId", AppId)) {
    throw new Error("Unauthorized");
  }
}

async function allowAccountAccess(stub) {
  let cid = new ClientIdentity(stub); // "stub" is the ChaincodeStub object passed to Init() and Invoke() methods

  if (!cid.assertAttributeValue("ChannelId", stub.getChannelID())) {
    throw new Error("Unauthorized");
  }
}

let Chaincode = class {
  // The Init method is called when the Smart Contract 'fabcar' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info("=========== Instantiated fabcar chaincode ===========");
    return shim.success();
  }
  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'fabcar'. The calling application program has also specified the particular smart contract
  // function to be called, with arguments
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    var counter = 0;
    let method = this[ret.fcn];

    try {
      //check account level access
      await allowAccountAccess(stub);
      //check  app level access
      await allowAppAccess(stub);
      if (!method) {
        console.error("no function of name:" + ret.fcn + " found");
        throw new Error("Received unknown function " + ret.fcn + " invocation");
      }
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async saveContentHash(stub, args) {
    if (args.length < 1) {
      throw new Error(
        "Incorrect argument."
      );
    }
   
    await stub.putState(args[0], Buffer.from(args[1]));
    return args[0];
  }
};

shim.start(new Chaincode());
