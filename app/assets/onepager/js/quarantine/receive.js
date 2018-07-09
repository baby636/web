/* eslint-disable no-console */
window.onload = function() {

  setTimeout(function() {
    var txid;

    if (!web3.currentProvider || !web3.currentProvider.isMetaMask) {
      $('step_zero').style.display = 'block';
      $('send_eth').style.display = 'none';
      $('loading').style.display = 'none';
    } else {
      txid = document.txid;
      var link = 'https://' + etherscanDomain() + '/tx/' + txid;
      if(document.web3network != document.network){
          _alert({ message: gettext("You are not on the right web3 network.  Please switch to ") + document.network }, 'error');
      }
      $('loading_txt').innerHTML = 'Waiting for <a href="' + link + '" target="_blank" rel="noopener noreferrer">transaction</a> to be mined..<br><br><a href="#" title="If the transaction seems to be loading forever, you can skip this step." style="border: 1px solid #fc7596; padding 5px 10px;" onclick="document.receive_tip_callback ()">Skip Wait</a>';
    }

    document.receive_tip_callback = function() {
      $('loading').style.display = 'none';
      if (web3.currentProvider.isMetaMask) {
        $('send_eth').style.display = 'block';
        $('step_zero').style.display = 'none';

        var private_key = $('private_key').value;
        var address = '0x' + lightwallet.keystore._computeAddressFromPrivKey(private_key);

        console.log(address);
        //TODO: redeem the tip

      }
    };
    callFunctionWhenTransactionMined(txid, document.receive_tip_callback);
  }, 500);


  if (!document.pk) {
    $('send_eth').innerHTML = '<h1>Error 🤖</h1> Invalid Link.  Please check your link and try again';
    return;
  }

  // default form values
  $('private_key').value = document.pk;

  // When 'Generate Account' is clicked
  $('receive').onclick = function() {
    mixpanel.track('Tip Receive Click', {});
    metaMaskWarning();

    // get form data
    var private_key = $('private_key').value;
    var _idx = '0x' + lightwallet.keystore._computeAddressFromPrivKey(private_key);

    console.log('fromAccount: ' + _idx);
    var forwarding_address = $('forwarding_address').value.trim();

    if (!forwarding_address || forwarding_address == '0x0') {
      _alert({ message: gettext('Not a valid forwarding address.') }, 'warning');
      return;
    }

    if (!_idx || _idx == '0x0') {
      _alert({ message: gettext('Invalid Link.  Please check your link and try again') }, 'warning');
      return;
    }
    if (!private_key) {
      _alert({ message: gettext('Invalid Link.  Please check your link and try again') }, 'warning');
      return;
    }
    $('send_eth').innerHTML = "<img src='/static/yge/images/loading_v2.gif' style='max-width: 70px; max-height: 70px;'><br><h4>Submitting to the blockchain..</h4>";
    loading_button(jQuery('#receive'));

        // find the nonce
    web3.eth.getTransactionCount(_idx, function(error, result) {
      var nonce = result;

      if (!nonce) {
        nonce = 0;
      }
      web3.eth.getBalance(_idx, function(error, result) {
        var balance = result.toNumber();

        // TODO: this is where we want to send the tx
        // setup raw transaction
        var estimate = Math.pow(10, 5);
        var gasPrice = Math.pow(10, 9) * 1.7;

        var data = contract().claimTransfer.getData(_idx, forwarding_address);
        var payloadData = data; // ??
        var fromAccount = _idx; // ???
        var gas = estimate;
        // maximize the gas price

        if (balance > (gas * gasPrice)) {
          gasPrice = balance / (gas + 1);
        }
        gasPrice = parseInt(gasPrice);
        console.log('balance: ' + balance + ' wei ');
        console.log('balance: ' + (balance / Math.pow(10, 18)) + ' eth ');
        console.log('gas: ' + gas);
        console.log('gasPrice: ' + gasPrice);
        console.log('delta (needed - actual): ' + (balance - (gas * gasPrice)) + ' wei');
        console.log('delta (needed - actual): ' + ((balance - (gas * gasPrice))) / Math.pow(10, 18) + ' eth');
        var gasLimit = gas + 1;
        var rawTx = {
          nonce: web3.toHex(nonce),
          gasPrice: web3.toHex(gasPrice),
          gasLimit: web3.toHex(gasLimit),
          gas: web3.toHex(gas),
          to: contract_address(),
          from: fromAccount,
          value: '0x00',
          data: payloadData
        };

        // sign & serialize raw transaction
        var tx = new EthJS.Tx(rawTx);

        tx.sign(new EthJS.Buffer.Buffer.from(private_key, 'hex'));
        var serializedTx = tx.serialize();

        // send raw transaction
        web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), callback);

      });
    });
  };
};