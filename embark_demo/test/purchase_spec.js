/*global artifacts, contract, config, it, assert, web3*/
const Purchase = artifacts.require("Purchase");

let accounts;
let buyerAddress;
let sellerAddress;
let price = 100000;
let state = {
  CREATED: 0,
  LOCKED: 1,
  INACTIVE: 2
};

// For documentation please see https://framework.embarklabs.io/docs/contracts_testing.html
config(
  {
    //blockchain: {
    //  accounts: [
    //    // you can configure custom accounts with a custom balance
    //    // see https://framework.embarklabs.io/docs/contracts_testing.html#Configuring-accounts
    //  ]
    //},
    contracts: {
      deploy: {
        Purchase: {
          args: [price],
          fromIndex: 0
        }
      }
    }
  },
  (_err, web3_accounts) => {
    accounts = web3_accounts;
    buyerAddress = accounts[1];
    sellerAddress = accounts[0];
  }
);

contract("Purchase", function() {
  this.timeout(0);

  it("Should deploy purchase", async function() {
    let result = await Purchase.options.address;
    let contractState = await Purchase.state();
    assert.ok(contractState == state["CREATED"]);
    assert.ok(result.length > 0);
  });

  it("Buyer deposits funds and confirms purchase", async function() {
    let result = await Purchase.methods.confirmPurchase().send({
      from: buyerAddress,
      value: price
    });
    let contractBuyerAddress = await Purchase.buyer();
    let contractSellerAddress = await Purchase.seller();
    let contractState = await Purchase.state();

    let contractBalance = await web3.eth.getBalance(Purchase.options.address);
    assert.ok(contractBuyerAddress == buyerAddress);
    assert.ok(contractSellerAddress == sellerAddress);
    assert.ok(contractBalance == price);
    assert.ok(contractState == state["LOCKED"]);
  });

  it("Buyer confirm received", async function() {
    let confirmReceivedBuyer = await Purchase.methods.confirmReceived().send({
      from: buyerAddress
    });
    let contractState = await Purchase.state();
    let contractBalance = await web3.eth.getBalance(Purchase.options.address);

    assert.eventEmitted(confirmReceivedBuyer, "ItemReceived", {});
    assert.ok(contractState == state["INACTIVE"]);
    assert.ok(contractBalance == 0);
  });

  it("Seller aborts item", async function() {
    let abortTx = await Purchase.methods.abort().send({
      from: sellerAddress
    });
    let contractState = await Purchase.state();
    let contractBalance = await web3.eth.getBalance(Purchase.options.address);

    assert.eventEmitted(abortTx, "Aborted", {});
    assert.ok(contractState == state["INACTIVE"]);
    assert.ok(contractBalance == 0);
  });

  // it("set storage value", async function () {
  //   await SimpleStorage.methods.set(150).send({from: web3.eth.defaultAccount});
  //   let result = await SimpleStorage.methods.get().call();
  //   assert.strictEqual(parseInt(result, 10), 150);
  // });

  // it("should have account with balance", async function() {
  //   let balance = await web3.eth.getBalance(accounts[0]);
  //   assert.ok(parseInt(balance, 10) > 0);
  // });
});
